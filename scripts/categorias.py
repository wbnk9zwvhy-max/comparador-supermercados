"""Categorías comunes (sección > categoría) para los cuatro supermercados.

Cada producto ya tiene su sección (construir_app.seccion). Aquí se le asigna una
categoría dentro de esa sección con reglas sobre su nombre y la ruta de
categorías de su tienda. La primera regla que encaja gana; si ninguna encaja,
va a la categoría de reserva de la sección.
"""
import re

# (clave, sección, nombre, reglas). Una regla es (texto_donde, patrón) o una tupla de varias que deben cumplirse.
# texto_donde: "n" nombre, "r" ruta de la tienda, "a" ruta y nombre, "x" subcategoría final de la tienda y nombre. Un patrón que empieza por "!" debe NO encajar.
C = []


def cat(clave, sec, nombre, *reglas):
    C.append((clave, sec, nombre, reglas))


# ------------------------------------------------------------------ Fruta y verdura
cat("fruta", "fv", "Fruta", ("x", r"platan|banana|manzana|\bperas?\b|naranja|mandarina|clementina|limon|\blimas?\b|\buvas?\b|fresa|frambuesa|arandano|kiwi|melon|sandia|\bpina\b|mango|aguacate|melocoton|nectarina|ciruela|cereza|granada|caqui|papaya|\bhigos?\b|chirimoya|pomelo|fruta|frutos rojos|\bcoco\b|maracuya|paraguayo|albaricoque|\bmoras?\b|pitahaya|lichi|membrillo|kumquat|nispero"))
cat("patata", "fv", "Patatas, cebollas y ajos", ("x", r"patata|cebolla|cebolleta|\bajos?\b|chalota|boniato|batata|\bpuerros?\b"))
cat("ensalada", "fv", "Lechugas y ensaladas", ("x", r"lechuga|ensalada|canonigo|rucula|brote|escarola|endibia|cogollo|lollo|mezclum|hoja de roble|berro"))
cat("setas", "fv", "Setas y champiñones", ("x", r"seta|champinon|boletus|shiitake|portobello"))
cat("verdura", "fv", "Verduras y hortalizas")

# ------------------------------------------------------------------ Carne
cat("c_picada", "carne", "Picada y hamburguesas", ("x", r"picad|hamburguesa|burger|albondiga|preparado de carne|steak tartar"))
cat("c_elaborados", "carne", "Empanados y elaborados", ("x", r"empanad|rebozad|nugget|san jacobo|flamenquin|cordon|librito|croqueta|crujiente|fingers|adobad|marinad|brocheta|pincho|kebab|rellen"))
cat("c_embutido", "carne", "Salchichas y embutido fresco", ("x", r"salchicha|longaniza|chorizo|morcilla|butifarra|chistorra|frankfurt"))
cat("c_pollo", "carne", "Pollo, pavo y otras aves", ("x", r"pollo|pavo|\baves?\b|codorniz|\bpato\b|picanton|muslo|contramuslo|alitas?|jamoncito|pechuga"))
cat("c_vacuno", "carne", "Ternera y vacuno", ("a", r"ternera|vacuno|\bbuey|\bvaca\b|anojo|entrecot|chuleton|\brabo\b|babilla|morcillo|redondo|aguja|tapa|cadera|culata|osobuco|hamburguesa de vacuno"))
cat("c_cerdo", "carne", "Cerdo", ("a", r"cerdo|\blomo\b|costilla|panceta|secreto|presa|pluma|iberic|chuleta|cinta|solomillo|carrillada|codillo|manita|oreja|careta|torrezno|magro|paletilla|jamon fresco|tocino|papada"))
cat("c_cordero", "carne", "Cordero, conejo y cabrito", ("x", r"cordero|conejo|cabrito|lechazo|chivo"))
cat("c_otros", "carne", "Otras carnes")

# ------------------------------------------------------------------ Pescado y marisco
cat("p_surimi", "pescado", "Surimi y gulas", ("x", r"surimi|\bgulas?\b|palito|delicias del? mar|barritas de mar|sucedaneo de angula"))
cat("p_ahumado", "pescado", "Ahumados y salazones", ("a", r"ahumad|salazon|anchoa|mojama|hueva|boqueron en vinagre|boquerones en vinagre|marinad|salado|desalado|tarama"))
cat("p_congelado", "pescado", "Pescado y marisco congelado", ("a", r"congelad"))
cat("p_marisco", "pescado", "Marisco", ("x", r"gamba|langostino|mejillon|almeja|berberecho|navaja|calamar|sepia|pulpo|chipiron|cigala|bogavante|necora|centollo|carabinero|vieira|ostra|cangrejo|zamburi|\bpota\b|marisco|camaron|percebe|choco\b|chopito"))
cat("p_fresco", "pescado", "Pescado fresco")

# ------------------------------------------------------------------ Charcutería y quesos
JAMON = r"jamon|paleta|paletilla|lacon|cecina"
cat("ch_pieza", "charcu", "Jamones y paletas enteros",
    ("x", JAMON), ("x", r"pieza|\bentero|\bentera|deshuesad|\bmaza\b|soporte|\bkit\b|jamonero"), ("n", "!cocid|york|pavo|pollo"))
cat("ch_taquitos", "charcu", "Taquitos y virutas", ("x", r"taco|taquito|virut|\bdados?\b|daditos|tiras de|troceado|picadillo|lardon"))
cat("ch_cocido", "charcu", "Jamón cocido y fiambre", ("x", r"cocid|york|fiambre|lacon|magro|cabeza de jabali|jamon extra|paleta cocida|asado"), ("n", "!pavo|pollo|\baves?\b"))
cat("ch_pavo", "charcu", "Fiambre de pavo y pollo", ("x", r"pavo|pollo|\baves?\b"), ("n", "!salchicha|frankfurt|bacon|chorizo|salchichon|fuet"))
cat("ch_jamon", "charcu", "Jamón serrano e ibérico en lonchas", ("x", JAMON))
cat("ch_curado", "charcu", "Chorizo, salchichón y lomo", ("x", r"chorizo|salchichon|\bfuet|\blomo\b|longaniza|espetec|cular|morcon|secallona|salami|pepperoni|sobrassada de|cecina|chistorra|embuchado|lomito"))
cat("ch_bacon", "charcu", "Bacon, salchichas y chopped", ("x", r"bacon|beicon|panceta|salchicha|frankfurt|chopped|mortadela|morcilla|butifarra|hot dog|wiener|cabeza"))
cat("ch_pate", "charcu", "Patés y sobrasada", ("x", r"\bpate|foie|sobrasada|sobrassada|mousse|rillette|crema de higado"))
cat("q_rallado", "charcu", "Queso rallado", ("x", r"rallad|gratinar|en polvo|parmesano rallado|\bhilos\b"))
cat("q_lonchas", "charcu", "Queso en lonchas y porciones", ("x", r"loncha|sandwich|fundido|porcion|quesito|tranchete|\bfetas?\b|lonchitas|lonchas"), ("x", r"queso|cheddar|edam|gouda|emmental|havarti|tranchete|quesito|maasdam|tierno"))
cat("q_fresco", "charcu", "Queso fresco y untable", ("x", r"fresco|burgos|untar|untable|crema de queso|philadelphia|mascarpone|ricotta|requeson|cottage|mozzarella|burrata|\bfeta\b|batido|tarrina|quark|skyr"))
cat("q_especial", "charcu", "Quesos especiales e importación", ("x", r"brie|camembert|\bazul|roquefort|gorgonzola|cabrales|\btorta\b|emmental|gouda|edam|cheddar|parmesano|grana padano|gruyere|raclette|\bcabra|idiazabal|tetilla|mahon|provolone|halloumi|comte|maasdam|torta del casar|san simon|havarti|fondue"))
cat("q_curado", "charcu", "Queso curado, semicurado y tierno", ("x", r"queso|curado|semicurado|tierno|manchego|\boveja|viejo|anejo"))
cat("ch_vegetal", "charcu", "Charcutería vegetal", ("x", r"vegetal|vegan|veggie|tofu|seitan|heura"))
cat("ch_otros", "charcu", "Otros de charcutería")

# ------------------------------------------------------------------ Leche, huevos y yogures
cat("l_huevos", "lacteos", "Huevos", ("x", r"huevo|\bclaras?\b|yema"))
cat("l_vegetal", "lacteos", "Bebidas vegetales", ("x", r"bebida (de )?(soja|avena|almendra|arroz|coco|vegetal|avellana|chufa|nuez|espelta)|bebidas vegetales|bebida vegetal"))
cat("l_batido", "lacteos", "Batidos", ("x", r"batido|merengada|leche (con |de )?(cacao|chocolate|fresa|vainilla)|cacaolat|choco"))
cat("l_leche", "lacteos", "Leche", ("x", r"\bleche\b"), ("n", "!yogur|postre|arroz con leche|natilla|flan|cuajada|mousse|gelatina|chocolate|galleta"))
cat("l_liquido", "lacteos", "Yogur líquido, bífidus y kéfir", ("a", r"liquido|bebible|para beber|l casei|actimel|kefir|bifidus|danacol|benecol|drink"))
cat("l_griego", "lacteos", "Yogur griego", ("x", r"griego"))
cat("l_postres", "lacteos", "Natillas, flanes y postres", ("x", r"natilla|\bflan|cuajada|arroz con leche|mousse|gelatina|crema catalana|tiramisu|postre|profiterol|\bcopa|panna|pudin|souffle|coulant|cheesecake|tarta de queso|petit|chocolate"))
cat("l_yogur", "lacteos", "Yogures", ("x", r"yogur|yogurt|skyr|danonino|\bbio\b|kefir|sabor|natural"))
cat("l_mantequilla", "lacteos", "Mantequilla y margarina", ("x", r"mantequilla|margarina|ghee|tulipan|\bflora\b|untar"))
cat("l_nata", "lacteos", "Nata", ("x", r"\bnata\b|crema de leche|para cocinar|para montar"))
cat("l_otros", "lacteos", "Otros lácteos")

# ------------------------------------------------------------------ Pan y bollería
cat("pa_molde", "pan", "Pan de molde", ("a", r"molde|pan de sandwich|pan sandwich|rebanad"))
cat("pa_hamburguesa", "pan", "Pan de hamburguesa, perritos y wraps", ("x", r"hamburguesa|perrito|hot dog|\bwrap|tortilla de trigo|tortillas de trigo|fajita|\bpita\b|\bnaan|burrito|tortillas"))
cat("pa_tostado", "pan", "Tostadas, picos y pan rallado", ("a", r"tostad|biscote|\bpicos?\b|rosquillet|regana|grisin|colines|pan rallado|picatoste|cracker|palitos|\bcolin|panecillo tostado|tostas"))
cat("pa_tartas", "pan", "Tartas y pasteles", ("x", r"tarta|pastel|tiramisu|\bbrazo|roscon|\bcocas?\b|milhoja|lionesa|eclair|profiterol"))
cat("pa_bolleria", "pan", "Bollería", ("a", r"croissant|cruasan|napolitana|magdalena|bizcocho|donut|palmera|ensaimada|brioche|\bcana\b|berlina|muffin|cupcake|sobao|rosquilla|pan de leche|bolleria|hojaldre|pastelito|\bbollo|suizo|trenza|chocolatina|caracola|plumcake|cookies|gofre|tortita|crepe|churro|porra|bunuelo"))
cat("pa_horno", "pan", "Pan de horno y barras", ("a", r"barra|baguette|chapata|hogaza|rustico|pan de horno|payes|panecillo|gallego|candeal|pan de pueblo|pan blanco|pan integral|pan comun|\bpan\b|chusco|mollete|bollito|centeno|espelta|semillas"))
cat("pa_otros", "pan", "Otros de panadería")

# ------------------------------------------------------------------ Despensa
cat("d_aceite", "despensa", "Aceite", ("x", r"^aceite|^aove"))
cat("d_vinagre", "despensa", "Vinagre y aliños", ("x", r"^vinagre|alino|balsamico|reduccion"))
cat("d_tomate", "despensa", "Tomate frito y triturado", ("x", r"^tomate|tomate (frito|triturado|natural|entero|troceado|concentrado|rallado|pelado)|salsa de tomate|sofrito|\bpassata"))
cat("d_salsas", "despensa", "Salsas", ("x", r"mayonesa|ketchup|mostaza|salsa|alioli|allioli|barbacoa|\bbrava|pesto|bechamel|vinagreta|\bsoja\b|tabasco|sriracha|chimichurri|teriyaki|carbonara|bolonesa"))
cat("d_especias", "despensa", "Sal, especias y sazonadores", ("x", r"^sal\b|sal (fina|gruesa|marina|yodada|escamas|del himalaya)|pimienta|oregano|comino|pimenton|curry|canela|azafran|colorante|perejil|tomillo|romero|laurel|especia|sazonador|en polvo|nuez moscada|jengibre|guindilla|cayena|hierbas|ajo granulado|ajo molido|clavo|anis estrellado|paprika|curcuma|eneldo|albahaca|cilantro|sazona"))
cat("d_arroz", "despensa", "Arroz", ("x", r"^arroz|arroz (redondo|largo|bomba|basmati|vaporizado|integral|jazmin|thai|risotto|sos|la fallera)|^vasito"), ("n", "!con leche"))
cat("d_pasta", "despensa", "Pasta", ("x", r"macarron|espagueti|spaghetti|tallarin|fideo|fideua|tiburon|helice|lacito|pluma|penne|fusilli|lasana|canelon|tortellini|ravioli|\bpasta|noodle|cuscus|couscous|gnocchi|noqui|rigatoni|farfalle|estrella|conchas?|macarrones|plumas|spirali|tagliatelle|fettuccine|orzo|maravilla|galets|ramen"))
cat("d_legumbres", "despensa", "Legumbres", ("x", r"lenteja|garbanzo|alubia|judion|judia (blanca|pinta|roja|negra)|\bhabas? (secas|cocidas)|soja texturizada|quinoa|frijol|azuki|edamame"))
cat("d_conserva_pescado", "despensa", "Conservas de pescado", ("x", r"\batun|bonito|sardin|caballa|melva|mejillon|berberecho|almeja|navaja|calamar|pulpo|anchoa|ventresca|zamburi|chipiron|hueva|bacalao|pescado|chicharro|salmon|bacoreta|pez espada|caviar|surimi|navajas"))
cat("d_caldos", "despensa", "Caldos, sopas y cremas", ("x", r"caldo|sopa|crema de|\bpure|consome|gazpacho|salmorejo|pastilla|avecrem|fumet|cocido|potaje|fabada|lentejas? con|garbanzos? con"))
cat("d_azucar", "despensa", "Azúcar y edulcorantes", ("x", r"azucar|edulcorante|sacarina|stevia|panela|sirope|eritritol|sucralosa|fructosa"), ("n", "!sin azucar|0%"))
cat("d_harina", "despensa", "Harina, levadura y repostería", ("a", r"harina|levadura|maizena|bicarbonato|gelatina|cobertura|fideos de chocolate|preparado para|colorante alimentario|vainill|agar|fondant|reposteria|pepitas|virutas|decoracion|semola|pan rallado|rebozador|almidon|masa"))
cat("d_conserva_veg", "despensa", "Conservas vegetales y de fruta", ("x", r"esparrago|\bmaiz|pimiento|alcachofa|guisante|judia verde|judias verdes|champinon|palmito|menestra|pisto|zanahoria|remolacha|almibar|melocoton|\bpina\b|macedonia|cereza|fruta|cebollita|piquillo|seta|espinaca|acelga|cardo|borraja|habita|brotes de|pepino|berenjena|calabacin|compota"))
cat("d_nutricion", "despensa", "Nutrición deportiva y dietética", ("x", r"nutricion deportiva|proteina|protein|whey|barrita|dietetic|complemento nutricional|sustitutivo|nutricion|creatina|isolate"))
cat("d_internacional", "despensa", "Cocina internacional", ("a", r"mexican|tortilla de maiz|sushi|\bwok\b|thai|oriental|asiatic|\btaco|fajita|kebab|internacional|etnic|nachos|tex mex|guacamole|hummus|tahini|miso|kimchi|curry|udon|arroz para sushi|alga"))
cat("d_otros", "despensa", "Otros de despensa")

# ------------------------------------------------------------------ Desayuno y dulces
cat("de_cafe", "desayuno", "Café", ("x", r"\bcafe|capsula|espresso|ristretto|lungo|cappuccino|descafeinado|nescafe|dolce gusto|nespresso|tassimo|achicoria|malta"))
cat("de_cacao", "desayuno", "Cacao y chocolate a la taza", ("x", r"cacao|cola cao|colacao|nesquik|chocolate a la taza|chocolate a la tasa|valor taza|cacao soluble"), ("n", "!crema de cacao|galleta|cereal"))
cat("de_te", "desayuno", "Té e infusiones", ("x", r"^te\b|\bte (verde|negro|rojo|chai|matcha|blanco|de|con)|infusion|manzanilla|poleo|\btila\b|rooibos|hierbaluisa|valeriana|tisana|camomila|jengibre y limon"))
cat("de_cereales", "desayuno", "Cereales y barritas", ("x", r"cereal|copos|muesli|granola|avena|corn flakes|cheerios|special k|krispies|barrita|kellogg|tortitas? de (arroz|maiz)|chocapic|fitness|choco flakes|frosties|crunchy|bolitas"))
cat("de_galletas", "desayuno", "Galletas", ("x", r"galleta|\bmaria\b|digestive|cookie|barquillo|wafer|tostadas dulces|princesa|principe|oreo|tuc|chiquilin|fontaneda|filipinos|bastoncitos|surtido|pastas de te|lengua de gato|bizcocho|mini"))
cat("de_mermelada", "desayuno", "Mermelada, miel y cremas de untar", ("x", r"mermelada|confitura|\bmiel\b|crema de cacao|nocilla|nutella|crema de (cacahuete|avellana|almendra|pistacho)|membrillo|dulce de leche|untable|crema de chocolate"))
cat("de_turron", "desayuno", "Turrones y dulces navideños", ("a", r"turron|mazapan|polvoron|mantecado|roscon|panettone|peladilla|guirlache|navidad|figuritas|alfajor|neula"))
cat("de_chocolate", "desayuno", "Chocolate y bombones", ("x", r"chocolate|bombon|tableta|chocolatina|kit kat|bounty|twix|snickers|kinder|ferrero|toblerone|lacasitos|conguitos|\bm m|milka|lindt|huevo de|trufa|praline|cacao [0-9]"))
cat("de_golosinas", "desayuno", "Caramelos, chicles y golosinas", ("x", r"caramelo|chicle|gominola|golosina|regaliz|piruleta|chuche|pastilla|\bnubes?\b|jelly|gummy|chupa|mentol|smint|halls|sugus|ositos|fresitas|grageas|chicles"))
cat("de_otros", "desayuno", "Otros dulces")

# ------------------------------------------------------------------ Aperitivos
cat("ap_patatas", "aperitivos", "Patatas fritas y snacks", ("x", r"patata|chips|snack|nacho|palomita|corteza|gusanito|ganchito|dorito|pringles|cheetos|\baros\b|tortilla de maiz|fritos|bocabit|triski|cracker|tortitas|tostaditas|crujiente|churrit|bastoncillo|risketos|matutano|lays|ruffles|sticks|bolitas|aperitivo"), ("n", "!aceituna|almendra|cacahuete|pistacho|anacardo"))
cat("ap_aceitunas", "aperitivos", "Aceitunas y encurtidos", ("x", r"aceituna|encurtido|pepinillo|banderilla|cebollita|alcaparra|guindilla|altramuz|berenjena|gilda|olivas|gordal|manzanilla|hojiblanca|chupadedos"))
cat("ap_frutos", "aperitivos", "Frutos secos y fruta desecada", ("x", r"almendra|\bnuez|nueces|anacardo|pistacho|cacahuete|avellana|\bpipas?\b|macadamia|pecana|pinon|frutos? secos?|cocktail|coctel|\bmix|kikos|maiz|\bpasas?\b|datil|orejon|ciruela|\bhigos?|arandano|desecad|deshidratad|semilla|chufa|garrapinada|fruta|coco|mango|platano"))
cat("ap_otros", "aperitivos", "Otros aperitivos")

# ------------------------------------------------------------------ Congelados
cat("co_helados", "congelados", "Helados", ("a", r"helado|\bpolos?\b|\bcono|cucurucho|bombon|tarrina|sorbete|granizado|magnum|calippo|corneto|sandwich|tarta helada|hielo picado|mochi|frigo"))
cat("co_hielo", "congelados", "Hielo", ("x", r"^hielo|cubitos"))
cat("co_pizza", "congelados", "Pizzas congeladas", ("x", r"pizza"))
cat("co_rebozados", "congelados", "Rebozados, croquetas y empanadillas", ("x", r"croqueta|empanadilla|rebozad|nugget|varitas|san jacobo|a la romana|aros de|tempura|fingers|delicias|empanada|churro|porra|bunuelo|palitos|crujiente|calamares"))
cat("co_pescado", "congelados", "Pescado y marisco congelado", ("a", r"merluza|bacalao|salmon|gamba|langostino|calamar|sepia|pulpo|mejillon|pescado|lenguado|abadejo|panga|\brape|emperador|\batun|marisco|chipiron|almeja|cigala|anilla|gallo|bacaladilla|dorada|lubina|boqueron|sardina|surimi|navaja|potón|choco"))
cat("co_verdura", "congelados", "Verduras, fruta y patatas", ("a", r"verdura|guisante|judia|espinaca|brocoli|menestra|salteado|patata|coliflor|pimiento|cebolla|\bmaiz|alcachofa|\bajo|wok|parrillada|champinon|seta|habas|esparrago|fruta|frutos rojos|mango|fresa|calabacin|zanahoria|acelga|pisto|edamame|aguacate|tropical"))
cat("co_carne", "congelados", "Carne congelada", ("a", r"hamburguesa|pollo|ternera|cerdo|carne|albondiga|pechuga|alitas|muslo|pavo|cordero|conejo|vacuno|burger"))
cat("co_platos", "congelados", "Platos preparados y tartas", )

# ------------------------------------------------------------------ Platos preparados
cat("pr_pizza", "preparados", "Pizzas, masas y empanadas", ("x", r"pizza|\bmasa|hojaldre|base|quiche|empanada|\bcocas?\b|focaccia|calzone"))
cat("pr_pasta", "preparados", "Pasta fresca", ("x", r"pasta fresca|tortellini|ravioli|gnocchi|noqui|lasana|canelon|tallarin|espagueti|fettuccine|cappelletti|girasoli|tagliatelle|pappardelle|pasta rellena|fideos frescos"))
cat("pr_gazpacho", "preparados", "Gazpacho, cremas y hummus", ("x", r"gazpacho|salmorejo|hummus|humus|guacamole|crema|\bpure|sopa|vichyssoise|tzatziki|\bbaba|dip|caldo"))
cat("pr_tortilla", "preparados", "Tortillas y ensaladillas", ("x", r"tortilla|ensaladilla|ensalada|tabule|cuscus|pasta fria|patatas ali"))
cat("pr_sandwich", "preparados", "Sándwiches y bocadillos", ("x", r"sandwich|bocadillo|\bwrap|montadito|burrito|pulga|bocata|panini|club"))
cat("pr_platos", "preparados", "Platos listos para comer")

# ------------------------------------------------------------------ Bebidas
cat("b_agua", "bebidas", "Agua", ("x", r"^agua|agua (mineral|con gas|sin gas)|\bfont\b|lanjaron|solan|bezoya|fuente"), ("n", "!tonica|colonia|micelar|sabor|limon|coco"))
cat("b_isotonica", "bebidas", "Isotónicas y energéticas", ("a", r"isotonic|energetic|red bull|monster|\bburn\b|powerade|aquarius|gatorade|energy|deportiva"))
cat("b_zumo", "bebidas", "Zumos y néctares", ("a", r"zumo|nectar|smoothie|exprimido|licuado|batido de fruta|mosto|gazpacho"))
cat("b_cola", "bebidas", "Refrescos de cola", ("x", r"\bcola\b|pepsi|coca"), ("n", "!cola cao"))
cat("b_refresco", "bebidas", "Refrescos de naranja, limón y otros", ("a", r"refresco|naranja|limon|gaseosa|tonica|bitter|ginger|te frio|ice tea|nestea|lipton|fanta|\bkas\b|sprite|7up|seven|schweppes|soda|limonada|horchata|granizado|kombucha|sin gas|con gas|sabor"))
cat("b_otros", "bebidas", "Otras bebidas")

# ------------------------------------------------------------------ Bodega
cat("v_sin", "bodega", "Cerveza sin alcohol", ("a", r"sin alcohol|0 0|0,0|\b00\b|tostada 0|0 0%"), ("a", r"cerveza|lager|radler|sin alcohol"))
cat("v_cerveza", "bodega", "Cerveza", ("a", r"cerveza|lager|\bipa\b|pilsner|radler|\bclara\b|shandy|stout|weiss|ale\b"))
cat("v_sangria", "bodega", "Sangría y tinto de verano", ("x", r"sangria|tinto de verano|calimocho|combinado|vino con"))
cat("v_cava", "bodega", "Cava, champán y sidra", ("a", r"\bcava\b|champan|champagne|espumoso|prosecco|sidra|\bbrut\b|frizzante|lambrusco|espumosos"))
cat("v_tinto", "bodega", "Vino tinto", ("a", r"tinto|crianza|reserva|roble|rioja|ribera|garnacha|tempranillo|monastrell|bobal|syrah|merlot|cabernet"))
cat("v_blanco", "bodega", "Vino blanco y rosado", ("a", r"blanco|rosado|verdejo|albarino|rueda|moscatel|godello|chardonnay|sauvignon|airen|macabeo|txakoli|vino"))
cat("v_licores", "bodega", "Licores y destilados", ("a", r"whisky|\bron\b|ginebra|\bgin\b|vodka|licor|brandy|\banis|tequila|orujo|vermut|vermouth|crema de|baileys|pacharan|cognac|jagermeister|aguardiente|\bfino\b|jerez|oporto|manzanilla|mistela|absenta|cazalla|amaretto|limoncello|ratafia|hierbas"))
cat("v_otros", "bodega", "Otras bebidas alcohólicas")

# ------------------------------------------------------------------ Limpieza y hogar
cat("li_ropa", "limpieza", "Detergente y suavizante", ("a", r"detergente|suavizante|quitamanchas|lavadora|prelavado|blanqueador|perlas|ropa|planchado|almidon|tinte para ropa|cuidado ropa"))
cat("li_vajilla", "limpieza", "Lavavajillas", ("a", r"lavavajillas|vajilla|abrillantador|sal regeneradora|maquina lavavajillas"))
cat("li_papel", "limpieza", "Papel higiénico, de cocina y servilletas", ("a", r"higienico|papel de cocina|rollo de cocina|servilleta|panuelo|tissue|celulosa|papel cocina|facial"))
cat("li_bolsas", "limpieza", "Bolsas, film y papel de aluminio", ("a", r"bolsa|film|aluminio|papel de horno|papel horno|envase|tupper|molde|bandeja|\bvasos?\b|\bplatos?\b|cubierto|desechable|conservacion|herme|mantel|pajita|palillo|menaje|taza|sarten|olla|cazo"))
cat("li_ambientador", "limpieza", "Ambientadores e insecticidas", ("a", r"ambientador|insecticida|mosquit|cucaracha|hormiga|polilla|\bvelas?\b|mikado|absorbe|antihumedad|aromatic|incienso|difusor|matamoscas|raid"))
cat("li_utensilios", "limpieza", "Bayetas, estropajos y utensilios", ("a", r"bayeta|estropajo|guante|fregona|escoba|recogedor|cepillo|esponja|mopa|\bcubo|plumero|gamuza|pinza|recambio|utensilio|calzado|betun"))
cat("li_limpiadores", "limpieza", "Limpiadores y lejía", ("a", r"lejia|amoniaco|friegasuelos|limpia|multiusos|cristal|desengrasante|antical|desinfectante|\bwc\b|quitagrasas|vitro|salfuman|limpiador|hogar|bano|cocina|muebles|suelo|madera|acero|horno|desatascador|gel wc|pastilla"))
cat("li_otros", "limpieza", "Pilas, bazar y otros")

# ------------------------------------------------------------------ Higiene y belleza
cat("h_bucal", "higiene", "Higiene bucal", ("a", r"dentifric|pasta de dientes|pasta dental|cepillo dental|cepillo de dientes|colutorio|enjuague|seda dental|hilo dental|dental|bucal|interdental|blanqueador dental"))
cat("h_parafarmacia", "higiene", "Parafarmacia y botiquín", ("a", r"tirita|aposito|venda|gasa|esparadrapo|alcohol|agua oxigenada|termometro|suero|bastoncillo|algodon|complemento|vitamina|fitoterapia|parafarmacia|botiquin|antiseptico|tension|magnesio|colageno|melatonina|omega|probiotico|jalea|ginseng|lagrima|mascarilla quirurgica|pastillas"))
cat("h_solar", "higiene", "Protección solar", ("a", r"solar|\bspf|bronceador|after sun|aftersun|autobronceador"))
cat("h_desodorante", "higiene", "Desodorante", ("a", r"desodorante|antitranspirante|roll on"))
cat("h_afeitado", "higiene", "Afeitado y depilación", ("a", r"afeitad|cuchilla|maquinilla|depila|\bcera\b|bandas|espuma de afeitar|after shave|aftershave|barba"))
cat("h_intima", "higiene", "Higiene íntima", ("a", r"compresa|tampon|salvaslip|protegeslip|intim|copa menstrual|braguita|incontinencia|panal adulto|pañal adulto|preservativo|lubricante"))
cat("h_cabello", "higiene", "Champú y cuidado del cabello", ("a", r"champu|acondicionador|mascarilla (capilar|cabello|pelo)|tinte|coloracion|\blaca|gomina|espuma|fijador|cabello|\bpelo|capilar|peine"))
cat("h_gel", "higiene", "Gel y jabón", ("a", r"gel|jabon|ducha|bano|esponja"))
cat("h_crema", "higiene", "Cremas y cuidado facial y corporal", ("a", r"crema|locion|serum|contorno|hidratante|facial|corporal|body|aceite|manos|pies|desmaquill|micelar|tonico|mascarilla|exfoliante|vaselina|labial|limpiador|cuidado"))
cat("h_maquillaje", "higiene", "Maquillaje y uñas", ("a", r"maquillaje|labial|pintalabios|mascara de pestanas|rimel|sombra|colorete|polvos|corrector|eyeliner|lapiz|esmalte|\bunas|quitaesmalte|brocha|pincel|pestana|base de maquillaje|barra de labios|sombra de ojos"))
cat("h_perfume", "higiene", "Colonias y perfumes", ("a", r"colonia|perfume|eau de|body mist|fragancia"))
cat("h_otros", "higiene", "Otros de higiene")

# ------------------------------------------------------------------ Bebé
cat("bb_panal", "bebe", "Pañales y toallitas", ("a", r"panal|toallita|braguita|dodot|talla"))
cat("bb_comida", "bebe", "Alimentación infantil", ("a", r"papilla|potito|leche|cereales|tarrito|bolsita|pouch|galleta|yogur|alimentacion|pure|fruta|infantil 8|meses|crecimiento|continuacion|iniciacion|biberon de"))
cat("bb_higiene", "bebe", "Higiene y cuidado del bebé")

# ------------------------------------------------------------------ Mascotas
cat("m_perro", "mascotas", "Perros", ("a", r"perro|canin|\bdog|puppy|cachorro"))
cat("m_gato", "mascotas", "Gatos", ("a", r"gato|felin|\bcat\b|arena|kitten|gatitos"))
cat("m_otros", "mascotas", "Otras mascotas")

cat("otros", "otros", "Otros")

# ------------------------------------------------------------------ motor
_compiladas = []
for clave, sec, nombre, reglas in C:
    comp = []
    for donde, pat in reglas:
        neg = pat.startswith("!")
        comp.append((donde, neg, re.compile(pat[1:] if neg else pat)))
    _compiladas.append((clave, sec, nombre, comp))

POR_SECCION = {}
for i, (clave, sec, nombre, comp) in enumerate(_compiladas):
    POR_SECCION.setdefault(sec, []).append(i)

LISTA = [(clave, sec, nombre) for clave, sec, nombre, _ in _compiladas]
INDICE = {clave: i for i, (clave, _, _) in enumerate(LISTA)}


def clasificar(sec, ruta, nombre):
    """Índice de categoría para un producto de la sección `sec` (clave) con su ruta y nombre ya normalizados."""
    hoja = ruta.split(" > ")[-1]
    for i in POR_SECCION.get(sec, POR_SECCION["otros"]):
        clave, _, _, comp = _compiladas[i]
        if not comp:
            return i  # reserva de la sección
        ok = True
        for donde, neg, rx in comp:
            texto = (nombre if donde == "n" else ruta if donde == "r" else ruta + " | " + nombre if donde == "a"
                     else hoja + " | " + nombre)
            if bool(rx.search(texto)) == neg:
                ok = False
                break
        if ok:
            return i
    return INDICE["otros"]


# formatos que no son de compra doméstica normal: no cuentan para «el más barato» salvo que se pidan
RX_PIEZA = re.compile(r"\bpieza\b|\bentero\b|\bentera\b|deshuesad|\bmaza\b|formato hosteleria|\bhosteleria\b|profesional|\bcaja de \d+ ?kg")


def es_formato_grande(sec, cat_clave, nombre_n, kg):
    if cat_clave == "ch_pieza":
        return True
    if sec == "charcu":
        return bool(RX_PIEZA.search(nombre_n)) or (kg is not None and kg > 1.2)
    if sec in ("carne", "pescado"):
        return (kg is not None and kg > 3.5) or "hosteleria" in nombre_n
    if sec in ("despensa", "desayuno", "aperitivos"):
        return (kg is not None and kg > 10) or "hosteleria" in nombre_n
    return "hosteleria" in nombre_n




# ------------------------------------------------------------------ lo natural que es un producto
# Criterio: es más sano lo menos procesado, no lo que tiene menos calorías. Se lee la lista de
# ingredientes (webs de Mercadona y DIA; Open Food Facts para Consum) y se cuentan los aditivos
# y los ingredientes propios de los ultraprocesados (aromas, edulcorantes, almidones modificados,
# jarabes, grasas vegetales refinadas…). Un queso de «leche, fermentos, sal y cuajo» queda por
# encima de uno con almidón, conservantes y aromas aunque este sea «light».
#
# Nivel (de más a menos natural):
#   4 Natural          sin aditivos y con pocos ingredientes (o alimento fresco de un solo ingrediente)
#   3 Sin aditivos     sin aditivos, pero con más ingredientes o con azúcar añadido
#   2 Poco procesado   un aditivo de conservación (conservante, antioxidante, corrector de acidez)
#                      (también va aquí lo que no tiene datos de ingredientes, para no premiarlo ni castigarlo)
#   1 Con aditivos     varios aditivos de conservación, o un ingrediente de ultraprocesado
#                      (para ordenar, lo que no tiene datos de ingredientes cuenta como este nivel: no se premia
#                       lo que no se puede comprobar)
#   0 Ultraprocesado   dos o más ingredientes de ultraprocesado
# La puntuación que usa la app es nivel × 10 + desempate (ecológico, huevos camperos, % de carne,
# integral, virgen extra), así que entre dos igual de naturales gana el ecológico o el de más carne.
import unicodedata as _ud


def _sin_tildes(t):
    t = _ud.normalize("NFKD", (t or "").lower())
    return "".join(ch for ch in t if not _ud.combining(ch))


# ingredientes típicos de ultraprocesados (clasificación NOVA, grupo 4)
ULTRA = [
    ("aromas", r"flavou?rings?|\baromes?\b|natural flavou?r|\baromas?\b|saborizante|aromatizante"),
    ("colorantes", r"\bcolou?rs?\b|\bcolou?ring|\bcolorants?\b|\bcolorantes?\b|caramelo (natural|e ?150)|\bcarmin|\bcochinilla|tartrazina|\bocre\b"),
    ("edulcorantes", r"sweetener|edulcorant|sucralose|acesulfame|aspartame|edulcorante|sucralosa|acesulfam|aspartam|ciclamat|sacarina|\bstevia|glucosidos de esteviol|maltitol|sorbitol|xilitol|eritritol|isomalt"),
    ("potenciadores del sabor", r"flavou?r enhancer|exhausteur de gout|yeast extract|extrait de levure|monosodium|potenciador(es)? del sabor|glutamato|inosinato|guanilato|extracto de levadura|levadura autolizada"),
    ("emulgentes", r"emulsifi|emulsifiant|lecithin|mono ?- ?(and|et) ?di ?- ?glycerid|emulgente|emulsionante|lecitina|mono ?y ?diglicerid|esteres? de"),
    ("espesantes", r"thickener|gelling agent|epaississant|gelifiant|xanthan|guar gum|locust bean|carrageenan|\bpectin|espesante|gelificante|goma (xantana|guar|garrofin|de garrofin|arabiga|gellan)|carragen|\bagar\b|pectina|alginato|celulosa|metilcelulosa|carboximetil"),
    ("estabilizantes", r"stabili[sz]er|stabilisant|estabilizante|estabilizador"),
    ("almidón modificado", r"modified (\w+ )?starch|amidon modifie|almidon(es)? modificado|almidon (de \w+ )?modificado|\balmidon\b.{0,25}\bmodificad"),
    ("azúcares industriales (jarabes, dextrosa)", r"glucose syrup|glucose-fructose syrup|fructose syrup|corn syrup|invert sugar|sirop de glucose|sirop de fructose|dextrose|maltodextrin|jarabe de (glucosa|fructosa|maiz|azucar invertido|glucosa ?y ?fructosa|fructosa ?y ?glucosa)|jarabe de \w+ ?fructosa|dextrosa|maltodextrina|azucar invertido|fructosa\b|glucosa\b|isoglucosa|polidextrosa|oligofructosa|inulina"),
    ("grasas vegetales refinadas", r"palm oil|palm fat|palm kernel|vegetable fat|hydrogenated|huile de palme|graisse vegetale|graisse de palme|aceite de palma|palmiste|grasa(s)? vegetal|grasa(s)? hidrogenada|hidrogenad|margarina|aceite(s)? vegetal(es)? \(?(palma|coco|colza)|grasa de palma|grasa de coco"),
    ("proteínas aisladas", r"protein isolate|whey powder|whey protein|milk protein|soy protein|soya protein|wheat gluten|proteines de lait|lactoserum en poudre|proteina(s)? (aislada|hidrolizada|de soja|de guisante|de trigo|de leche|lactea|vegetal)|aislado de proteina|caseinato|gluten de trigo|suero (de leche )?en polvo|lactosuero en polvo|concentrado de proteina"),
    ("sales de fundido y fosfatos", r"emulsifying salts|sels de fonte|phosphate|sales de fundido|sales fundentes|fosfato|polifosfato|difosfato|trifosfato|citrato sodico"),
    ("antiaglomerantes y gasificantes", r"anti-?caking|raising agent|poudre a lever|anti-?agglomerant|humectant|antiaglomerante|gasificante|humectante|antiespumante|agente de recubrimiento|agente de carga|secuestrante|soporte"),
]
# aditivos de conservación: restan, pero no hacen ultraprocesado por sí solos
CONSERVA = [
    ("conservantes", r"preservative|conservateur|sorbate|benzoate|sulphite|sulfite|nitrite|conservador|conservante|sorbato|benzoato|nitrito|nitrato|sulfito|metabisulfito|bisulfito|anhidrido sulfuroso|dioxido de azufre|propionato|nisina|natamicina|lisozima"),
    ("antioxidantes", r"antioxidant|ascorbate|tocopherol|rosemary extract|antioxidante|ascorbato|eritorbato|isoascorbato|tocoferol|extracto de romero|\bbha\b|\bbht\b|galato"),
    ("correctores de acidez", r"acidity regulator|correcteur d.acidite|acidifiant|acidifier|lactic acid|acide lactique|corrector(es)? de (la )?acidez|regulador(es)? de (la )?acidez|acidulante|lactato (de |sodico|potasico)|acetato (de |sodico)|ácido lactico|acido lactico|acido acetico|acido malico|acido tartarico|glucono"),
]
# números E: 1xx colorantes, 2xx conservantes, 3xx antioxidantes y correctores, 4xx espesantes y emulgentes,
# 5xx correctores y antiaglomerantes, 6xx potenciadores, 9xx edulcorantes y otros, 14xx almidones modificados
NUMERO_E = re.compile(r"\be ?-?(\d{3,4})[a-z]?\b")
E_SUAVES = {"300", "330", "290", "941", "938", "939", "948", "949", "170", "500", "503", "322"}  # vit. C, ácido cítrico, gases del envase, bicarbonato
E_GRUPO = {"1": "colorantes", "2": "conservantes", "3": "antioxidantes", "4": "espesantes", "5": "correctores de acidez",
           "6": "potenciadores del sabor", "9": "edulcorantes"}
RX_AZUCAR = re.compile(r"\bsugar\b|\bsucre\b|\bhoney\b|\bazucar(es)?\b(?! (natural|propio|de la fruta|presente))|\bpanela\b|\bmiel\b|melaza")
RX_CONTIENE = re.compile(r"(puede contener|contiene|alergenos?|informacion nutricional|valor energetico|trazas).*$")

# alimentos de un solo ingrediente que las webs no acompañan de lista de ingredientes
FRESCOS = {"fruta", "patata", "ensalada", "setas", "verdura", "c_vacuno", "c_cerdo", "c_cordero", "c_pollo", "c_otros",
           "p_fresco", "p_marisco", "l_huevos", "d_legumbres", "d_arroz", "ap_frutos", "b_agua", "d_aceite"}
SIN_DATOS = "Sin datos de ingredientes"


def _ingredientes_principales(t):
    """Ingredientes de primer nivel: separados por comas fuera de los paréntesis."""
    partes, nivel, actual = [], 0, ""
    for ch in t:
        if ch in "([":
            nivel += 1
        elif ch in ")]":
            nivel = max(0, nivel - 1)
        if ch in ",;" and nivel == 0:
            partes.append(actual)
            actual = ""
        else:
            actual += ch
    partes.append(actual)
    partes = [x for p in partes for x in re.split(r"\s+y\s+|\s+e\s+", re.sub(r"\([^()]*\)", "", p))] if len(partes) < 40 else partes
    out = []
    for p in partes:
        p = re.sub(r"\(.*", "", p).strip(" .:*-")
        p = re.sub(r"\d+([.,]\d+)? ?%", "", p).strip()
        if 1 < len(p) < 80:
            out.append(p)
    return out


def analizar_ingredientes(texto):
    """(nº de ingredientes, aditivos de ultraprocesado, aditivos de conservación, azúcar añadido) o None si no hay texto útil."""
    texto = re.split(r"\.\s+(?=(Fabricado|Elaborado|Puede|Contiene|Sin |Apto|Producto|Envasado|Conservar|Informaci|Consumir|Mantener|Al[eé]rg|Trazas|Origen))", texto)[0]
    t = _sin_tildes(texto)
    t = RX_CONTIENE.sub("", t)
    t = t.replace("conservado en", " ").replace("conservacion", " ")
    # el cloruro cálcico del queso es un coadyuvante tradicional del cuajado: no resta
    t = re.sub(r"(estabilizante|estabilizador)\s*:?\s*\(?\s*(cloruro (de )?calcio|cloruro calcico|e ?-?509)\s*\)?", " ", t)
    t = re.sub(r"cloruro (de )?calcio|cloruro calcico|\be ?-?509\b", " ", t)
    if len(t) < 3:
        return None
    # textos que no son una lista de ingredientes (tablas nutricionales mal leídas por OCR en Open Food Facts)
    if re.search(r"\bkcal\b|\bkj\b|valor(es)? energetic|hidratos de carbono|grasas saturadas|de las cuales", t) or len(re.findall(r"\d+[.,]?\d*", t)) > 12:
        return None
    ultra, cons = [], []
    for nombre, rx in ULTRA:
        if re.search(rx, t):
            ultra.append(nombre)
    for nombre, rx in CONSERVA:
        if re.search(rx, t):
            cons.append(nombre)
    for num in NUMERO_E.findall(t):
        if num in E_SUAVES:
            continue
        g = "almidón modificado" if num.startswith("14") and len(num) == 4 else E_GRUPO.get(num[0])
        if not g:
            continue
        if g in ("conservantes", "antioxidantes", "correctores de acidez"):
            if g not in cons:
                cons.append(g)
        elif g not in ultra:
            ultra.append(g)
    principales = _ingredientes_principales(t)
    return len(principales) or 1, ultra, cons, bool(RX_AZUCAR.search(t))


def _desempate(cat_clave, n):
    """0-9: señales del nombre para desempatar entre productos igual de naturales."""
    b = 0
    if cat_clave == "l_huevos":
        b += 4 if re.search(r"\becologic|\bbio\b", n) else 3 if re.search(r"camper|gallinas libres|corral", n) else 1 if "suelo" in n else 0
    elif re.search(r"\becologic|\bbio\b|\beco\b|organic", n):
        b += 3
    if cat_clave in ("ch_pavo", "ch_cocido"):
        m = [float(x.replace(",", ".")) for x in re.findall(r"(\d{2}(?:[.,]\d)?) ?%", n)]
        m = [x for x in m if 50 <= x <= 100]
        if m:
            b += 4 if max(m) >= 90 else 3 if max(m) >= 80 else 1
    if re.search(r"integral|grano entero", n):
        b += 2
    if cat_clave == "d_aceite" and "virgen extra" in n:
        b += 3
    if re.search(r"sin azucar|0 ?% azucar|sin azucares anadidos", n):
        b += 1
    return min(9, b)


NO_COMIDA = {"limpieza", "higiene", "otros"}
NO_COMIDA_CAT = {"bb_panal", "bb_higiene", "m_otros"}


def naturalidad(cat_clave, nombre, ingredientes, nova=None, sec=None):
    """(puntuación = nivel×10 + desempate, motivo para la app, detalle) de un producto."""
    if sec in NO_COMIDA or cat_clave in NO_COMIDA_CAT:
        return 20, "", None
    n = _sin_tildes(nombre)
    extra = _desempate(cat_clave, n)
    a = analizar_ingredientes(ingredientes) if ingredientes else None
    if a is None:
        if nova in (1, 2) or (nova is None and cat_clave in FRESCOS and not re.search(r"cocid|asad|frit|empanad|marinad|adobad|en conserva|lata|tarro|bote|salsa", n)):
            return 40 + extra, "Natural: alimento sin procesar", None
        if nova == 4:
            return extra, "Ultraprocesado (Open Food Facts)", None
        if nova == 3:
            return 30 + extra, "Procesado sencillo (Open Food Facts)", None
        return 10 + extra, SIN_DATOS, None
    num, ultra, cons, azucar = a
    det = {"n": num, "u": ultra, "c": cons, "az": azucar}
    if len(ultra) >= 2:
        return extra, "Ultraprocesado: " + ", ".join(ultra[:3]), det
    if len(ultra) == 1:
        return 10 + extra, "Con " + ultra[0], det
    if len(cons) >= 2:
        return 10 + extra, "Con " + " y ".join(cons[:2]), det
    if len(cons) == 1:
        return 20 + extra, "Poco procesado: con " + cons[0], det
    if azucar and cat_clave not in ("de_mermelada", "de_chocolate", "de_turron", "de_golosinas", "d_azucar"):
        return 30 + extra, "Sin aditivos, con azúcar añadido", det
    if num <= 6:
        return 40 + extra, f"Natural: {num} ingrediente{'s' if num != 1 else ''}, sin aditivos", det
    return 30 + extra, f"Sin aditivos ({num} ingredientes)", det


# ------------------------------------------------------------------ equivalencias entre supermercados
# Equivalencias entre supermercados: el mismo producto con otro nombre.
#
# Cada tienda llama a las cosas a su manera: «La Gula del Norte» (Consum) es lo que Mercadona
# vende como «Delicias del mar de surimi» y DIA como «Sucedáneo de angulas»; la «Ternera gallega
# de guisar» de Consum es el «Añojo para guisar», los «Tacos de vacuno para guisar»…
# Aquí se traduce el nombre de cada producto a un nombre canónico con el que comparar.
#
#   FRASES     expresiones de varias palabras que se sustituyen por su concepto
#   PALABRAS   sinónimos de una palabra (sobre la raíz ya normalizada: sin tildes, plural ni género)
#   IGNORAR    calificativos de origen o de calidad que no cambian qué producto es
#
# Lo usan construir_app.py (para los tipos de producto) y la app (para el buscador y los sustitutos),
# que recibe estas mismas tablas en catalogo.json. Para añadir un caso nuevo basta con una línea aquí.


# (expresión regular sobre el nombre normalizado, concepto). Se aplican en orden y todas las que encajen.
FRASES = [
    # pescado
    (r"\bgulas?\b|sucedaneo de angula|delicias del? mar\b|angulas? de surimi|\bgulitas?\b", "gula"),
    (r"palitos? (de )?(surimi|mar|cangrejo)|barritas? (de )?(surimi|mar)|surimi en barritas|palitos del mar", "palito surimi"),
    (r"\bmerluza\b.*\b(lomo|filete|rodaja|supremas?)\b|\b(lomo|filete|rodaja|supremas?)\b.*\bmerluza\b", "merluza filete"),
    (r"\bsalmon\b.*\b(lomo|filete|supremas?|tacos?|porcion)\b", "salmon filete"),
    (r"\batun claro\b|\batun\b", "atun"),
    (r"\bbonito del norte\b", "bonito"),
    (r"\bsardinillas?\b", "sardina"),
    (r"\bboquerones? en vinagre\b|\bboquerones? marinados?\b", "boqueron vinagre"),
    (r"\bbacalao\b.*\bdesalad", "bacalao desalado"),
    (r"\blangostinos?\b|\bgambon(es)?\b", "langostino"),
    (r"\bcalamar(es)? a la romana\b|\baros de calamar\b|\banillas de calamar\b.*rebozad", "calamar romana"),
    # carne
    (r"(ternera|vacuno|anojo|anojo|buey|vaca)\b.*\b(guisar|estofar|estofado|guiso|para cocido|tacos?|dados|trozos)\b"
     r"|\b(guisar|estofar|estofado|guiso|tacos?|dados|trozos)\b.*\b(ternera|vacuno|anojo|buey|vaca)\b", "vacuno guisar"),
    (r"(cerdo|magro)\b.*\b(guisar|estofar|estofado|tacos?|dados)\b|\bmagro (de cerdo )?(en )?(tacos|dados)\b", "cerdo guisar"),
    (r"\b(carne )?picada\b.*\b(mixta|cerdo y (vacuno|ternera)|vacuno y cerdo|ternera y cerdo)\b|\bpreparado de carne picada\b|\bburger meat\b.*\bmixt", "picada mixta"),
    (r"\b(carne )?picada\b.*\b(vacuno|ternera|anojo)\b|\b(vacuno|ternera|anojo)\b.*\bpicad", "picada vacuno"),
    (r"\bpechugas? (de )?pollo\b.*\b(filete|fileteada|en filetes)\b|\bfiletes? de pechuga de pollo\b", "pollo pechuga filete"),
    (r"\b(alitas?|alas) de pollo\b|\bpollo\b.*\balitas?\b", "pollo alita"),
    (r"\bcontramuslos?\b", "contramuslo"),
    (r"\blomo (de cerdo )?(en )?(filetes|fileteado)\b|\bcinta de lomo\b|\bfiletes de lomo\b", "cerdo lomo filete"),
    (r"\bchuletas? de aguja\b|\bchuleta de cerdo aguja\b", "cerdo chuleta aguja"),
    (r"\bcostillas? (de cerdo|cerdo)\b|\bcostilla\b.*\bcerdo\b", "cerdo costilla"),
    (r"\bsalchichas? (tipo )?frankfurt|\bsalchichas? cocidas\b|\bwiener\b|\bhot dog\b", "salchicha frankfurt"),
    # charcutería y quesos
    (r"\bjamon (de )?(york|cocido)\b|\bjamon cocido\b|\bfiambre de jamon\b", "jamon cocido"),
    (r"\bjamon (serrano|curado|reserva|gran reserva|bodega)\b", "jamon serrano"),
    (r"\b(pavo|pechuga de pavo)\b.*\b(lonchas|loncheado|fiambre|finas)\b|\bfiambre de (pechuga de )?pavo\b", "pavo fiambre"),
    (r"\bqueso\b.*\b(fresco|burgos|batido)\b|\bqueso de burgos\b", "queso fresco"),
    (r"\bqueso\b.*\b(rallado|gratinar|pizza)\b", "queso rallado"),
    (r"\bqueso\b.*\b(lonchas|sandwich|tranchete)\b", "queso lonchas"),
    (r"\bbacon\b|\bbeicon\b|\bpanceta ahumada\b", "bacon"),
    # lácteos y huevos
    (r"\bhuevos?\b.*\b(m|medianos?)\b|\bhuevos? camperos?\b.*\b(m|medianos?)\b", "huevo mediano"),
    (r"\bhuevos?\b.*\b(l|grandes?)\b", "huevo grande"),
    (r"\bleche\b.*\bsemi( |-)?desnatad|\bsemidesnatada\b", "leche semidesnatada"),
    (r"\bleche\b.*\bdesnatad", "leche desnatada"),
    (r"\bleche\b.*\bentera\b", "leche entera"),
    (r"\bleche\b.*\bsin lactosa\b|\bleche\b.*\b0 ?% lactosa\b", "leche sin lactosa"),
    (r"\b(leche|bebida)\b.*\b(soja)\b", "bebida soja"),
    (r"\b(leche|bebida)\b.*\b(avena)\b", "bebida avena"),
    (r"\b(leche|bebida)\b.*\b(almendra)", "bebida almendra"),
    (r"\b(leche|bebida)\b.*\b(arroz)\b(?!.* con leche)", "bebida arroz"),
    (r"\bnata\b.*\b(cocinar|cocina|culinaria)\b|\bcrema de leche para cocinar\b", "nata cocinar"),
    (r"\bnata\b.*\b(montar)\b", "nata montar"),
    (r"\byogur(es)? natural(es)?\b(?!.*(azucarad|edulcorad|sabor|fresa|limon|macedonia))", "yogur natural"),
    (r"\byogur(es)? griego", "yogur griego"),
    # fruta, verdura y despensa
    (r"\bpatatas?\b(?!.*(fritas|chips|bolsa de aperitivo|snack|paja|onduladas|lisas))", "patata"),
    (r"\btomates? (de )?rama\b", "tomate rama"),
    (r"\btomates? pera\b", "tomate pera"),
    (r"\bcanonigos?\b", "canonigo"),
    (r"\b(lechuga )?iceberg\b", "lechuga iceberg"),
    (r"\bplatanos?\b.*\bcanarias\b|\bplatano igp\b", "platano canarias"),
    (r"\bbananas?\b", "banana"),
    (r"\bgarbanzos?\b.*\b(cocidos?|bote|frasco|tarro)\b", "garbanzo cocido"),
    (r"\blentejas?\b.*\b(cocidas?|bote|frasco|tarro)\b", "lenteja cocida"),
    (r"\balubias?\b.*\b(cocidas?|bote|frasco|tarro)\b|\bjudias? blancas? cocidas?\b", "alubia cocida"),
    (r"\btomate frito\b", "tomate frito"),
    (r"\btomate triturado\b|\btomate natural triturado\b", "tomate triturado"),
    (r"\baceite (de )?oliva virgen extra\b|\baove\b", "aceite oliva virgen extra"),
    (r"\baceite (de )?oliva\b(?!.*virgen)", "aceite oliva"),
    (r"\baceite (de )?girasol\b", "aceite girasol"),
    (r"\barroz\b.*\bredondo\b", "arroz redondo"),
    (r"\barroz\b.*\b(largo|basmati|jazmin|vaporizado)\b", "arroz largo"),
    (r"\b(espaguetis?|spaghetti|espagueti)\b", "espagueti"),
    (r"\bmacarrones?\b", "macarron"),
    (r"\bpan de molde\b.*\b(sin corteza)\b", "pan molde sin corteza"),
    (r"\bpan de molde\b.*\bintegral\b", "pan molde integral"),
    (r"\bpan de molde\b", "pan molde"),
    (r"\bpan tostado\b|\btostadas?\b(?!.*(dulce|maiz))", "pan tostado"),
    (r"\bpicos?\b|\bpiquitos?\b|\bregan(as|itas)\b", "pico pan"),
    # bebidas
    (r"\brefresco de cola\b|\bcola (zero|light|normal|original)\b|\bcoca[ -]?cola\b|\bpepsi\b", "refresco cola"),
    (r"\b(refresco|bebida) (de )?naranja\b|\bnaranja con gas\b|\bfanta naranja\b|\bkas naranja\b", "refresco naranja"),
    (r"\b(refresco|bebida) (de )?limon\b|\blimon con gas\b|\bfanta limon\b|\bkas limon\b", "refresco limon"),
    (r"\bgaseosa\b", "gaseosa"),
    (r"\btonica\b", "tonica"),
    (r"\bagua mineral\b|\bagua natural\b|\bagua de manantial\b", "agua mineral"),
    (r"\bzumo\b.*\bnaranja\b|\bnaranja\b.*\bzumo\b", "zumo naranja"),
    (r"\bcerveza\b.*\b(sin alcohol|0,0|0 0)\b", "cerveza sin alcohol"),
    # limpieza e higiene
    (r"\bpapel higienico\b", "papel higienico"),
    (r"\bpapel de cocina\b|\brollo de cocina\b|\bpapel cocina\b", "papel cocina"),
    (r"\bdetergente\b.*\b(capsulas?|pastillas?|monodosis)\b", "detergente capsula"),
    (r"\bdetergente\b.*\b(liquido|gel)\b", "detergente liquido"),
    (r"\bdetergente\b.*\bpolvo\b", "detergente polvo"),
    (r"\bsuavizante\b", "suavizante"),
    (r"\blavavajillas\b.*\b(maquina|pastillas?|capsulas?|todo en 1)\b", "lavavajillas maquina"),
    (r"\blavavajillas\b.*\b(mano|liquido|concentrado)\b", "lavavajillas mano"),
    (r"\blejia\b", "lejia"),
    (r"\bfriegasuelos\b|\blimpiador de suelos\b|\blimpia suelos\b", "friegasuelos"),
    (r"\bgel (de )?(bano|ducha)\b|\bgel de ducha\b", "gel ducha"),
    (r"\bchampu\b", "champu"),
    (r"\bpasta (de dientes|dentifrica|dental)\b|\bdentifrico\b", "pasta dientes"),
]

# sinónimos de una palabra (palabra → palabra canónica; se comparan por su raíz, sin tildes, plural ni género)
PALABRAS = {
    "añojo": "vacuno", "ternera": "vacuno", "buey": "vacuno", "vaca": "vacuno",
    "estofar": "guisar", "estofado": "guisar", "guiso": "guisar", "guisado": "guisar",
    "tacos": "dados", "trozos": "dados", "taquitos": "dados", "daditos": "dados",
    "beicon": "bacon", "york": "cocido",
    "spaghetti": "espaguetis", "espagueti": "espaguetis",
    "jugo": "zumo", "yogurt": "yogur", "maní": "cacahuete", "camarón": "gamba",
    "frankfurt": "salchicha", "hierbabuena": "menta", "clementina": "mandarina",
    "judía": "alubia", "judías": "alubia", "habichuela": "alubia", "frijol": "alubia",
    "colorín": "alubia", "brick": "brik", "lonchas": "loncha", "lonchitas": "loncha", "loncheado": "loncha",
    "fileteado": "filete", "fileteada": "filete", "filetes": "filete",
    "cerdo": "cerdo", "porcino": "cerdo", "pavo": "pavo",
    "palomitas": "palomita", "rosquilletas": "picos", "regañás": "picos", "piquitos": "picos",
    "chuches": "golosina", "gominolas": "golosina", "gominola": "golosina",
    "refresco": "refresco", "soda": "refresco",
}

# calificativos que no cambian qué producto es (solo para comparar; se siguen viendo en el nombre)
IGNORAR = {
    "gallega", "gallego", "galleg", "asturian", "asturiana", "aviles", "avila", "segovia", "nacional", "espana",
    "espanol", "espanola", "origen", "igp", "dop", "seleccion", "selecta", "selecto", "calidad", "extra", "premium",
    "tradicional", "artesan", "artesana", "casero", "caser", "clasic", "clasico", "original", "norte", "fresc",
    "fresco", "fresca", "refrigerad", "refrigerado", "envasad", "bandeja", "familiar", "maxi", "mini", "pack",
    "ahorro", "granel", "sueltos", "suelt", "unidad", "aprox", "kg", "marca", "msc", "lm", "kilo",
}
