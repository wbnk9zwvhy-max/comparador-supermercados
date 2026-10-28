"""Lectura de la lista de ingredientes en el texto de una foto (scripts/ingredientes.py: extraer)."""
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
import ingredientes as I  # noqa: E402

VOCAB = {"alcachofas", "agua", "sal", "aceite", "girasol", "harina", "trigo", "azucar", "leche", "cacao", "levadura"}


class Extraer(unittest.TestCase):
    def test_corta_en_informacion_nutricional_aunque_salte_de_linea(self):
        t, q = I.extraer("INGREDIENTES: Alcachofas. —\nInformación\nnutricional * Valor energético 30 kcal", VOCAB)
        self.assertEqual(t, "Alcachofas")
        self.assertEqual(q, 1.0)

    def test_une_palabras_partidas_y_tildes_sueltas(self):
        t, _ = I.extraer("Ingredientes: harina de tri-\ngo, agua, sal y levadura.\nConservar en lugar fresco", VOCAB)
        self.assertEqual(t, "harina de trigo, agua, sal y levadura")
        t, _ = I.extraer("Ingredientes: azúcar, cacao. Información nutricional", VOCAB)
        self.assertEqual(t, "azúcar, cacao")

    def test_sin_la_palabra_ingredientes_no_hay_lista(self):
        self.assertEqual(I.extraer("Leche entera de vaca 1 L", VOCAB), (None, 0))

    def test_tabla_nutricional_colada_no_vale(self):
        self.assertEqual(I.extraer("Ingredientes: hidratos de carbono 12,5 g, proteínas 3 g", VOCAB), (None, 0))

    def test_puntuacion_baja_con_palabras_raras(self):
        _, q = I.extraer("Ingredientes: xqzrt wvbnm agua plkjh", VOCAB)
        self.assertLess(q, 0.45)


if __name__ == "__main__":
    unittest.main()
