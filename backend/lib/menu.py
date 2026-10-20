"""Urban Burguer menu — static catalogue (source of truth for prices; orders are priced server-side)."""

IMG = {
    "burger_a": "https://images.pexels.com/photos/18987002/pexels-photo-18987002.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "burger_b": "https://images.pexels.com/photos/109400/pexels-photo-109400.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "burger_c": "https://images.unsplash.com/photo-1788601405398-e8a4d3a6d7c9?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "combo_a": "https://images.pexels.com/photos/19247570/pexels-photo-19247570.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "combo_b": "https://images.unsplash.com/photo-1547754070-c73f90c116b5?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "combo_c": "https://images.unsplash.com/photo-1763689389824-dd2cea2e5772?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "fries": "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "fries_loaded": "https://images.unsplash.com/photo-1518013431117-eb1465fa5752?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "pastel": "https://images.pexels.com/photos/6054485/pexels-photo-6054485.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "chicken": "https://images.pexels.com/photos/33068077/pexels-photo-33068077.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "potato_a": "https://images.unsplash.com/photo-1761712826074-5f1bab2b2f32?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "potato_b": "https://images.pexels.com/photos/9203735/pexels-photo-9203735.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "potato_c": "https://images.pexels.com/photos/9203737/pexels-photo-9203737.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "can_a": "https://images.pexels.com/photos/4113653/pexels-photo-4113653.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "can_b": "https://images.pexels.com/photos/33469209/pexels-photo-33469209.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
}

CATEGORIES = [
    {"id": "especiais", "name": "Especiais"},
    {"id": "classicos", "name": "Clássicos"},
    {"id": "tradicionais", "name": "Tradicionais"},
    {"id": "combos-especiais", "name": "Combos Especiais"},
    {"id": "combos-tradicionais", "name": "Combos Tradicionais"},
    {"id": "porcoes", "name": "Porções"},
    {"id": "batatas-recheadas", "name": "Batatas Recheadas"},
    {"id": "bebidas", "name": "Bebidas"},
]

ADDONS = [
    {"id": "blend-carne", "name": "Blend de carne", "price": 5.0},
    {"id": "blend-frango", "name": "Blend de frango", "price": 5.0},
    {"id": "carne-desfiada", "name": "Carne desfiada", "price": 5.0},
    {"id": "bacon", "name": "Bacon", "price": 3.0},
    {"id": "queijo", "name": "Queijo", "price": 3.0},
    {"id": "ovo", "name": "Ovo", "price": 2.0},
    {"id": "salada", "name": "Salada", "price": 2.0},
    {"id": "presunto", "name": "Presunto", "price": 2.0},
    {"id": "calabresa", "name": "Calabresa", "price": 2.0},
    {"id": "cebola-caramelizada", "name": "Cebola caramelizada", "price": 2.0},
    {"id": "maionese-casa", "name": "Maionese da casa", "price": 2.0},
    {"id": "molho-casa", "name": "Molho da casa", "price": 2.0},
]


def _i(id, cat, name, price, desc, img, addons=False, badge=None):
    return {"id": id, "category_id": cat, "name": name, "price": float(price), "description": desc,
            "image": IMG[img], "allows_addons": addons, "badge": badge}


ITEMS = [
    _i("o-chefao", "especiais", "O Chefão", 34, "Pão, 2 blends 130g, 2 queijos, 2 presuntos, 2 ovos, calabresa, bacon, milho, salada, batata palha e molho da casa.", "burger_a", True, "O mais monstro"),
    _i("o-magnata", "especiais", "O Magnata", 32, "Pão, blend 130g, queijo, presunto, ovo, salada e geleia de abacaxi da casa.", "burger_b", True),
    _i("o-patrao", "especiais", "O Patrão", 26, "Pão, blend 130g, queijo, presunto, ovo, salada, geleia de abacaxi com pimenta e maionese da casa.", "burger_c", True),
    _i("o-padrinho", "classicos", "O Padrinho", 22, "Pão, blend 130g, queijo, salada coleslaw, bacon e molho da casa.", "burger_b", True, "Favorito"),
    _i("o-comandante", "classicos", "O Comandante", 22, "Pão, blend de frango 130g, queijo, calabresa, cebola caramelizada e molho da casa.", "burger_a", True),
    _i("classico-bacon", "tradicionais", "O Clássico Bacon", 15, "Pão, blend 90g, queijo, bacon e maionese da casa.", "burger_c", True),
    _i("classico-egg", "tradicionais", "O Clássico Egg", 14, "Pão, blend 90g, queijo, ovo e maionese da casa.", "burger_b", True),
    _i("classico-salad", "tradicionais", "O Clássico Salad", 13, "Pão, blend 90g, queijo, alface, tomate e maionese da casa.", "burger_a", True),
    _i("combo-magnata", "combos-especiais", "Combo O Magnata", 45, "O Magnata + batata simples + Guaraná lata.", "combo_a", True, "Combo top"),
    _i("combo-padrinho", "combos-especiais", "Combo O Padrinho", 35, "O Padrinho + Coca-Cola.", "combo_b", True),
    _i("combo-classico-bacon", "combos-tradicionais", "Combo Clássico Bacon", 23, "O Clássico Bacon + Guaraná lata.", "combo_c", True),
    _i("combo-classico-egg", "combos-tradicionais", "Combo Clássico Egg", 22, "O Clássico Egg + batata pequena + Coca-Cola lata.", "combo_a", True),
    _i("combo-classico-salad", "combos-tradicionais", "Combo Clássico Salad", 21, "O Clássico Salad + batata pequena + Guaraná lata.", "combo_b", True),
    _i("batata-simples", "porcoes", "Batata Simples", 15, "Porção de batata frita crocante.", "fries"),
    _i("batata-bacon-cheddar", "porcoes", "Batata com Bacon e Cheddar", 22, "Batata frita coberta com cheddar cremoso e bacon.", "fries_loaded", False, "Mais pedida"),
    _i("pastelzinhos", "porcoes", "Porção de Pastelzinhos (10 unid.)", 18, "10 pastelzinhos fritos na hora.", "pastel"),
    _i("tirinhas-frango", "porcoes", "Tirinhas de Frango", 24, "Tirinhas de frango empanadas e crocantes.", "chicken"),
    _i("batata-carne-requeijao", "batatas-recheadas", "Carne e Requeijão", 26, "Batata recheada com carne desfiada e requeijão cremoso.", "potato_a"),
    _i("batata-frango-bacon-queijo", "batatas-recheadas", "Frango, Bacon e Queijo", 26, "Batata recheada com frango desfiado, bacon e queijo muçarela.", "potato_b"),
    _i("batata-pizza", "batatas-recheadas", "Pizza", 26, "Batata recheada com queijo, presunto e milho.", "potato_c"),
    _i("guarana-lata", "bebidas", "Guaraná Lata", 8, "Lata 350ml bem gelada.", "can_b"),
    _i("coca-lata", "bebidas", "Coca-Cola Lata", 6, "Lata 350ml bem gelada.", "can_a"),
    _i("coca-zero-lata", "bebidas", "Coca-Cola Zero Lata", 6, "Lata 350ml bem gelada.", "can_a"),
    _i("fanta-laranja", "bebidas", "Fanta Laranja", 8, "Lata 350ml bem gelada.", "can_b"),
    _i("fanta-uva", "bebidas", "Fanta Uva", 8, "Lata 350ml bem gelada.", "can_b"),
]

ITEMS_BY_ID = {i["id"]: i for i in ITEMS}
ADDONS_BY_ID = {a["id"]: a for a in ADDONS}
