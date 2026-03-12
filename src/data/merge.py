import json

questions = json.load(open("questions.json", encoding="utf-8"))
explanations = json.load(open("explanations.json", encoding="utf-8"))

expl_map = {e["id"]: e["explanation"] for e in explanations}

for q in questions:
    if q["id"] in expl_map:
        q["explanation"] = expl_map[q["id"]]

json.dump(questions, open("questions_updated.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)

actualizadas = sum(1 for q in questions if q.get("explanation"))
print(f"Listo! {actualizadas} preguntas con explicación de {len(questions)} totales")