"""Criterio de «más sano = más natural» (scripts/categorias.py). Se ejecuta con: npm run test:py"""
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
from categorias import naturalidad, SIN_DATOS  # noqa: E402

NATURAL, SIN_ADITIVOS, POCO, CON_ADITIVOS, ULTRA = 4, 3, 2, 1, 0


def nivel(cat, nombre, ingredientes, **kw):
    return naturalidad(cat, nombre, ingredientes, **kw)[0] // 10


class Naturalidad(unittest.TestCase):
    def test_queso_tradicional_es_natural(self):
        # el cloruro cálcico, los fermentos y el cuajo del queso no restan
        self.assertEqual(nivel("l_queso", "Queso curado", "Leche de oveja, fermentos lácticos, sal y cuajo"), NATURAL)
        self.assertEqual(nivel("l_queso", "Queso semicurado",
                               "Leche pasteurizada de vaca, sal, fermentos lácticos, cuajo y estabilizante (cloruro cálcico)"), NATURAL)
        self.assertEqual(nivel("l_queso", "Queso tierno", "Leche, fermentos, sal, cuajo, E-509"), NATURAL)

    def test_acido_citrico_y_vitamina_c_no_restan(self):
        self.assertEqual(nivel("b_zumo", "Zumo de naranja", "Zumo de naranja, ácido cítrico, vitamina C"), NATURAL)

    def test_pechuga_de_pavo_con_aditivos_es_ultraprocesada(self):
        n = nivel("ch_pavo", "Pechuga 92% pavo lonchas",
                  "Pechuga de pavo (92%), sal, dextrosa, aromas, estabilizantes (E-451, E-407), antioxidante (E-316), conservador (E-250)")
        self.assertEqual(n, ULTRA)

    def test_desempates(self):
        base = naturalidad("ch_pavo", "Pechuga de pavo 80%", "Pechuga de pavo, sal")[0]
        mas_carne = naturalidad("ch_pavo", "Pechuga de pavo 95%", "Pechuga de pavo, sal")[0]
        self.assertEqual(base // 10, mas_carne // 10)
        self.assertGreater(mas_carne, base)
        self.assertGreater(naturalidad("d_aceite", "Aceite de oliva virgen extra", "Aceite de oliva virgen extra")[0],
                           naturalidad("d_aceite", "Aceite de oliva", "Aceite de oliva")[0])
        self.assertGreater(naturalidad("l_huevos", "Huevos camperos", None)[0], naturalidad("l_huevos", "Huevos suelo", None)[0])

    def test_sin_datos_cuenta_como_con_aditivos(self):
        p, motivo, _ = naturalidad("d_galletas", "Galletas", None)
        self.assertEqual(p // 10, CON_ADITIVOS)
        self.assertEqual(motivo, SIN_DATOS)

    def test_frescos_sin_lista_son_naturales(self):
        self.assertEqual(nivel("fruta", "Limones malla", None), NATURAL)
        self.assertEqual(nivel("verdura", "Pimientos asados en conserva", None), CON_ADITIVOS)

    def test_tabla_nutricional_no_es_lista_de_ingredientes(self):
        self.assertEqual(naturalidad("d_galletas", "Galletas", "Valor energético 450 kcal, grasas saturadas 2 g")[1], SIN_DATOS)


if __name__ == "__main__":
    unittest.main()
