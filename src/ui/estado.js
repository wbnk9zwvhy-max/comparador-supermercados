/* ------------------------------------------------------------------ estado de la lista (privado por persona) */
const CLAVE_LOCAL = "comparador.estado.v1";
const ESTADO_INICIAL = { items: [], activas: [0, 1, 2, 3], max: 4, envio: false, ajustes: {}, rev: 0 };
function useEstado() {
  const [estado, setEstado] = useState(() => ({ ...ESTADO_INICIAL, ...leer(CLAVE_LOCAL, {}) }));
  const ref = useRef(null), cola = useRef(Promise.resolve()), temporizador = useRef(null), ultimo = useRef(estado);
  const [sync, setSync] = useState("local");
  ultimo.current = estado;
  useEffect(() => {
    let unsub = null, vivo = true;
    (async () => {
      const c = window.claude;
      if (!c || !c.use) return;
      const [db, user] = await Promise.all([c.use("db"), c.use("user")]);
      if (!vivo || !db || !user) return;
      const uid = await user.id();
      if (!uid) return;
      const doc = db.doc("data/users/" + uid + "/estado");
      ref.current = doc;
      setSync("nube");
      unsub = doc.onSnapshot(snap => {
        if (!snap.exists) { if (ultimo.current.items.length) programar(); return; }
        if (snap.metadata.hasPendingWrites) return;
        const r = snap.data();
        if ((r.rev || 0) > (ultimo.current.rev || 0)) setEstado(e => ({ ...e, ...r }));
      }, () => setSync("local"));
    })();
    return () => { vivo = false; unsub && unsub(); };
  }, []);
  const programar = useCallback(() => {
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      const doc = ref.current; if (!doc) return;
      const datos = JSON.parse(JSON.stringify(ultimo.current));
      cola.current = cola.current.then(() => doc.set(datos)).catch(() => setSync("local"));
    }, 600);
  }, []);
  const cambiar = useCallback(fn => {
    setEstado(e => {
      const n = { ...fn(e), rev: Date.now() };
      guardar(CLAVE_LOCAL, n);
      return n;
    });
    programar();
  }, [programar]);
  return [estado, cambiar, sync];
}

