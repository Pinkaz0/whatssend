import json
from dotenv import load_dotenv
load_dotenv()

from actseguimiento_final_ok_COMPLETO_FUNCIONAL import consultar_orden_toa, cerrar_driver

try:
    res = consultar_orden_toa("1233458313")
    print(json.dumps(res, indent=2, ensure_ascii=False))
finally:
    cerrar_driver()
