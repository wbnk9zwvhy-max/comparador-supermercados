/* Marcador «Llenar carrito» del Comparador de supermercados.
   Se ejecuta en la web del súper (con tu sesión) y añade a su carrito la lista que la app pone en la dirección
   (#comparador=...). Mercadona y Consum: si no has iniciado sesión, la deja en el carrito de invitado, que el súper
   guarda al identificarte. DIA: el carrito va por cookie, con o sin sesión. No envía nada a ningún otro sitio. */
(async () => {
  const avisar = t => alert("Comparador · " + t);
  let raw = (location.href.match(/comparador=([A-Za-z0-9_-]+)/) || [])[1];
  if (!raw) raw = prompt("Pega el código de la cesta que copiaste en el Comparador:") || "";
  raw = ((raw.match(/comparador=([A-Za-z0-9_-]+)/) || [])[1] || raw).trim();
  if (!raw) return;
  let cesta;
  try { cesta = JSON.parse(decodeURIComponent(escape(atob(raw.replace(/-/g, "+").replace(/_/g, "/"))))); }
  catch (e) { return avisar("El código de la cesta no es válido. Vuelve a abrirlo desde la app."); }
  const host = location.hostname, lineas = cesta.l || [];
  const quitarHash = () => history.replaceState(null, "", location.pathname + location.search);
  const json = async r => { const t = await r.text(); try { return JSON.parse(t); } catch (e) { return null; } };
  try {
    if (/mercadona\.es$/.test(host)) {
      if (cesta.s !== "m") return avisar("Esta cesta es de otro supermercado.");
      const user = JSON.parse(localStorage.getItem("MO-user") || "null");
      const wh = (JSON.parse(decodeURIComponent((document.cookie.match(/__mo_da=([^;]+)/) || [])[1] || "%7B%7D")).warehouse) || "vlc1";
      const q = `?lang=es&wh=${wh}`;
      if (user && user.token && user.uuid) {
        const url = `/api/customers/${user.uuid}/cart/${q}`, cab = { Authorization: "Bearer " + user.token, "Content-Type": "application/json" };
        const actual = await json(await fetch(url, { headers: cab }));
        if (!actual) return avisar("Mercadona no ha devuelto tu carrito. Vuelve a iniciar sesión y prueba otra vez.");
        const lines = (actual.lines || []).map(l => ({ quantity: l.quantity, product_id: l.product.id, sources: l.sources || [], ...(l.version ? { version: l.version } : {}) }));
        for (const [id, n] of lineas) {
          const l = lines.find(x => String(x.product_id) === String(id));
          if (l) l.quantity += n; else lines.push({ quantity: n, product_id: String(id), sources: [] });
        }
        const r = await fetch(url, { method: "PUT", headers: cab, body: JSON.stringify({ id: actual.id, ...(actual.version ? { version: actual.version } : {}), lines }) });
        if (!r.ok) return avisar("Mercadona no ha aceptado la cesta (error " + r.status + ").");
      } else {
        const c = JSON.parse(localStorage.getItem("MO-cart") || "null") || { id: crypto.randomUUID(), lines: [] };
        c.id = c.id || crypto.randomUUID();
        for (const [id, n] of lineas) {
          const l = c.lines.find(x => String(x.product_id) === String(id));
          if (l) l.quantity += n; else c.lines.push({ quantity: n, product_id: String(id), sources: [] });
        }
        localStorage.setItem("MO-cart", JSON.stringify(c));
      }
      quitarHash(); avisar(`Añadidos ${lineas.length} productos al carrito de Mercadona.`); location.reload();
    } else if (/consum\.es$/.test(host)) {
      if (cesta.s !== "c") return avisar("Esta cesta es de otro supermercado.");
      // sesión iniciada: el token JWT que guarda la web (lleva tu número de cliente en «tolId»)
      let token = null;
      for (const st of [localStorage, sessionStorage]) for (let i = 0; i < st.length; i++) {
        const v = st.getItem(st.key(i)) || "", m = v.match(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g) || [];
        for (const t of m) { try { const p = JSON.parse(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))); if (p.tolId && (!p.exp || p.exp * 1000 > Date.now())) token = { t, id: p.tolId }; } catch (e) {} }
      }
      const tol = JSON.parse(localStorage.getItem("CookieTol") || "null") || { expireDate: new Date(Date.now() + 864e5).toISOString(), value: {} };
      if (token) {
        const zona = (tol.value && (tol.value.zoneId ?? tol.value.zone)) ?? 0, envio = (tol.value && tol.value.shippingZoneId) || "0D";
        const cab = { Authorization: "Bearer " + token.t, "X-TOL-USERID": String(token.id), "X-TOL-LOCALE": "es", "X-TOL-ZONE": String(zona),
          "X-TOL-CHANNEL": "1", "X-TOL-CURRENCY": "EUR", "X-TOL-SHIPPING-ZONE": String(envio), "X-TOL-APP": "shop-front", "Content-Type": "application/json" };
        const body = lineas.map(([id, n, code]) => ({ id: Number(id), quantity: n, remarks: "", ...(code ? { code: String(code) } : {}) }));
        const r = await fetch(`/api/rest/V2.0/shopping/cart/products?loadCoupons=true&shippingZoneId=${envio}&shippingMethod=D`, { method: "POST", headers: cab, body: JSON.stringify(body) });
        if (!r.ok) return avisar("Consum no ha aceptado la cesta (error " + r.status + "). Abre el carrito una vez y vuelve a probar.");
      } else {
        tol.value = tol.value || {};
        const prods = tol.value.products || [];
        for (const [id, n, code] of lineas) {
          const p = prods.find(x => String(x.id) === String(id));
          if (p) p.quantity += n; else prods.push({ id: Number(id), quantity: n, remarks: "", code: code ? String(code) : undefined });
        }
        tol.value.products = prods;
        localStorage.setItem("CookieTol", JSON.stringify(tol));
        // la web reescribe su copia en memoria al salir: hasta recargar, no se le deja pisar la nuestra
        const orig = Storage.prototype.setItem;
        Storage.prototype.setItem = function (k, v) { if (k === "CookieTol") return; return orig.call(this, k, v); };
      }
      quitarHash(); avisar(`Añadidos ${lineas.length} productos al carrito de Consum.`); location.reload();
    } else if (/dia\.es$/.test(host)) {
      if (cesta.s !== "d") return avisar("Esta cesta es de otro supermercado.");
      let ok = 0, mal = 0;
      for (const [id, n] of lineas) {
        const r = await fetch("/api/v1/cart/current/item", { method: "POST", credentials: "include",
          headers: { Accept: "application/json", "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
          body: JSON.stringify({ sku_id: String(id), quantity: n }) });
        r.ok ? ok++ : mal++;
      }
      quitarHash(); avisar(`Añadidos ${ok} productos al carrito de DIA${mal ? ` (${mal} no se pudieron añadir: puede que no estén disponibles en tu zona)` : ""}.`);
      location.href = "/cart";
    } else {
      avisar("Abre primero la web de Mercadona, Consum o DIA (el botón «Llenar carrito» de la app te lleva) y pulsa el marcador allí.");
    }
  } catch (e) { avisar("No se ha podido llenar el carrito: " + e.message); }
})();
