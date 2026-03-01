from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from datetime import datetime
import time
import os
import json

# Variables globales para mantener la sesión activa
driver = None
last_activity_time = None
SESSION_TIMEOUT = 600  # 15 minutos en segundos
tiempos_consulta = []
consultas_exitosas = 0
consultas_fallidas = 0

# Función de utilidad para formatear tiempo
def formatear_tiempo(segundos):
    """Convierte segundos en formato legible (minutos:segundos.milisegundos)"""
    minutos = int(segundos // 60)
    segundos_restantes = segundos % 60
    return f"{minutos}m:{segundos_restantes:.2f}s"
def registrar_estadisticas(resultado):
    """Registra estadísticas de consulta para análisis"""
    global tiempos_consulta, consultas_exitosas, consultas_fallidas
    
    if "tiempo_consulta" in resultado:
        tiempos_consulta.append(resultado["tiempo_consulta"])
        
    if resultado.get("estado") == "Error":
        consultas_fallidas += 1
    else:
        consultas_exitosas += 1

def iniciar_driver():
    """Inicia el driver de Chrome con opciones optimizadas"""
    global last_activity_time
    
    chrome_options = webdriver.ChromeOptions()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--start-maximized")
    chrome_options.add_argument("--window-size=1920,1080")
    
    # Opciones adicionales para mejorar estabilidad
    chrome_options.add_argument('--disable-extensions')
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_argument('--disable-logging')
    chrome_options.add_argument('--log-level=3')
    chrome_options.add_argument('--silent')
    chrome_options.add_argument('--disable-default-apps')
    chrome_options.add_argument('--disable-translate')
    chrome_options.add_argument('--disable-features=TranslateUI')
    chrome_options.add_argument('--disable-notifications')
    
    # Mejorar el rendimiento y reducir el consumo de recursos
    chrome_options.add_experimental_option('excludeSwitches', ['enable-logging'])
    
    try:
        # En Linux VPS usamos el chromium del sistema (apt install chromium-browser)
        # En Windows usamos webdriver_manager para descarga automática
        import platform
        if platform.system() == "Linux":
            # Rutas del sistema para Ubuntu/Debian
            chromium_paths = [
                "/usr/bin/chromium-browser",
                "/usr/bin/chromium",
                "/snap/bin/chromium",
            ]
            chromedriver_paths = [
                "/usr/bin/chromedriver",
                "/usr/lib/chromium-browser/chromedriver",
                "/usr/lib/chromium/chromedriver",
            ]
            
            # Encontrar el binario de chromium
            chrome_bin = next((p for p in chromium_paths if os.path.exists(p)), None)
            driver_bin = next((p for p in chromedriver_paths if os.path.exists(p)), None)
            
            if chrome_bin:
                chrome_options.binary_location = chrome_bin
                print(f"🐧 Usando chromium del sistema: {chrome_bin}")
            
            if driver_bin:
                service = Service(driver_bin)
                print(f"🐧 Usando chromedriver del sistema: {driver_bin}")
            else:
                # Fallback a webdriver_manager
                service = Service(ChromeDriverManager().install())
                print("⚠️ chromedriver del sistema no encontrado, usando webdriver-manager")
        else:
            service = Service(ChromeDriverManager().install())
        
        driver = webdriver.Chrome(service=service, options=chrome_options)
        driver.set_page_load_timeout(30)
        
        # Actualizar tiempo de última actividad
        last_activity_time = time.time()
        
        print("✅ Driver iniciado correctamente")
        return driver
    except Exception as e:
        print(f"❌ Error iniciando driver: {e}")
        return None


def es_pagina_login():
    try:
        WebDriverWait(driver, 2).until(
            EC.presence_of_element_located((By.ID, "username"))
        )
        return True
    except:
        return False

def manejar_timeout_o_reconexion():
    global driver
    try:
        WebDriverWait(driver, 2).until(
            EC.visibility_of_element_located((By.XPATH, '//h2[contains(text(), "Timeout de sesión")]'))
        )
        print("⚠️ Timeout de sesión detectado.")
        return True
    except:
        if es_pagina_login():
            print("⚠️ Redirigido a login. Reintentando sesión.")
            return True
        return False

def intentar_inicio_sesion():
    global driver, last_activity_time

    WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.ID, "username")))
    username = driver.find_element(By.ID, "username")
    password = driver.find_element(By.ID, "password")
    username.send_keys(os.getenv("TOA_USERNAME", "26300136"))
    password.send_keys(os.getenv("TOA_PASSWORD", ""))
    driver.find_element(By.ID, "sign-in").click()

    # Espera mínima para verificar si hay sesión abierta
    time.sleep(1)

    try:
        delsession_checkbox = driver.find_element(By.ID, "delsession")
        if not delsession_checkbox.is_selected():
            delsession_checkbox.click()
        password = driver.find_element(By.ID, "password")
        password.clear()
        password.send_keys(os.getenv("TOA_PASSWORD", ""))
        driver.find_element(By.ID, "sign-in").click()
    except:
        pass

    # Esperamos a que la página principal cargue completamente
    try:
        WebDriverWait(driver, 6).until(
            EC.invisibility_of_element_located((By.CLASS_NAME, "loading-overlay"))
        )
    except:
        pass

    last_activity_time = time.time()

def get_shadow_text_by_id(driver, element_id):
    js = """
    function findById(node, id) {
        if (!node) return null;
        if (node.id === id) return node;
        if (node.shadowRoot) {
            let res = findById(node.shadowRoot, id);
            if (res) return res;
        }
        if (node.childNodes) {
            for (let child of node.childNodes) {
                let res = findById(child, id);
                if (res) return res;
            }
        }
        return null;
    }
    let el = findById(document.body, arguments[0]);
    return el ? el.textContent.trim() : "";
    """
    try:
        return driver.execute_script(js, element_id)
    except:
        return ""

def get_shadow_text_by_class(driver, class_name):
    js = """
    function findByClass(node, className) {
        if (!node) return null;
        if (node.classList && node.classList.contains(className)) return node;
        if (node.shadowRoot) {
            let res = findByClass(node.shadowRoot, className);
            if (res) return res;
        }
        if (node.childNodes) {
            for (let child of node.childNodes) {
                let res = findByClass(child, className);
                if (res) return res;
            }
        }
        return null;
    }
    let el = findByClass(document.body, arguments[0]);
    return el ? el.textContent.trim() : "";
    """
    try:
        return driver.execute_script(js, class_name)
    except:
        return ""

meses_es_a_en = {
    "Ene": "Jan", "Feb": "Feb", "Mar": "Mar", "Abr": "Apr",
    "May": "May", "Jun": "Jun", "Jul": "Jul", "Ago": "Aug",
    "Sep": "Sep", "Oct": "Oct", "Nov": "Nov", "Dic": "Dec"
}

# FUNCIÓN MEJORADA DE VERIFICACIÓN DE SESIÓN CON TIEMPO
def verificar_sesion():
    """Verifica si la sesión sigue activa y el driver funciona correctamente"""
    global driver, last_activity_time
    
    # Verificar tiempo de inactividad
    tiempo_actual = time.time()
    if last_activity_time is not None:
        tiempo_inactivo = tiempo_actual - last_activity_time
        if tiempo_inactivo > SESSION_TIMEOUT:
            print(f"⚠️ Sesión inactiva por {int(tiempo_inactivo)} segundos (límite: {SESSION_TIMEOUT}s)")
            print("🔄 Reiniciando driver por inactividad...")
            cerrar_driver()
            driver = iniciar_driver()
            driver.get("https://telefonica-cl.etadirect.com/")
            intentar_inicio_sesion()
            last_activity_time = tiempo_actual
            return
    
    # Si no hay driver, crear uno nuevo
    if driver is None:
        print("🟢 Iniciando driver")
        driver = iniciar_driver()
        driver.get("https://telefonica-cl.etadirect.com/")
        intentar_inicio_sesion()
        last_activity_time = tiempo_actual
        return
    
    # Verificar si el driver está operativo
    try:
        # Intenta obtener la URL actual
        current_url = driver.current_url
    except:
        print("❌ Driver no operativo. Reiniciando...")
        cerrar_driver()
        driver = iniciar_driver()
        driver.get("https://telefonica-cl.etadirect.com/")
        intentar_inicio_sesion()
        last_activity_time = tiempo_actual
        return
    
    # Verificar si estamos en login
    try:
        actual_url = driver.current_url.lower()
        if "login" in actual_url or driver.title.lower() == "sign in":
            print("🔄 Detectada página de login - reconectando")
            driver.get("https://telefonica-cl.etadirect.com/")
            intentar_inicio_sesion()
            last_activity_time = tiempo_actual
            return
    except:
        pass
    
    # Solo actualizar tiempo
    last_activity_time = tiempo_actual
    
def consultar_orden_toa(numero_orden):
    global driver
    # Iniciar contador de tiempo
    tiempo_inicio = time.time()
    
    print(f"🟢 Iniciando consulta para orden: {numero_orden}")
    verificar_sesion()
    print(f"\n{'='*50}")
    print(f"🟢 NUEVA BÚSQUEDA: {numero_orden}")
    print(f"{'='*50}")
    
    # Debug simple del estado del campo de búsqueda
    search_fields = driver.find_elements(By.XPATH, "//input[contains(@class, 'search-bar-input') and @type='search']")
    print(f"Campos de búsqueda encontrados: {len(search_fields)}")
    for i, field in enumerate(search_fields):
        print(f"Campo {i}: visible={field.is_displayed()}, habilitado={field.is_enabled()}")
    
    search_icons = driver.find_elements(By.CLASS_NAME, "action-global-search-icon")
    print(f"Iconos de lupa encontrados: {len(search_icons)}")
    for i, icon in enumerate(search_icons):
        print(f"Icono {i}: visible={icon.is_displayed()}, habilitado={icon.is_enabled()}")
        
    resultado = {
        "orden": numero_orden,
        "cliente": "Desconocido",
        "estado": "",
        "direccion": "Sin dirección",
        "fecha_emision": "",
        "fecha_agenda": "",
        "observacion": "ORDEN SIN OBSERVACIÓN",
        "fibra": "DATOS DE FIBRA OK",
        "tecnico": "SIN TECNICO ASIGNADO"
    }

    try:
        # Verificar si el campo de búsqueda está visible
        try:
            search_field = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.XPATH, "//input[contains(@class, 'search-bar-input') and @type='search']"))
            )
            print("Caja de búsqueda ya visible.")
        except TimeoutException:
            # Si no está visible, hacer clic en el icono de la lupa
            try:
                search_icon = WebDriverWait(driver, 10).until(
                    EC.element_to_be_clickable((By.CLASS_NAME, "action-global-search-icon"))
                )
                driver.execute_script("arguments[0].click();", search_icon)
                print("Se hizo clic en la lupa porque la caja de búsqueda no estaba visible.")
                
                # Esperar a que aparezca el campo de búsqueda
                search_field = WebDriverWait(driver, 10).until(
                    EC.element_to_be_clickable((By.XPATH, "//input[contains(@class, 'search-bar-input') and @type='search']"))
                )
            except TimeoutException:
                print("⚠️ No se pudo encontrar el icono de búsqueda ni el campo de búsqueda")
                resultado["estado"] = "Error"
                resultado["observacion"] = "No se pudo acceder a la búsqueda"
                return resultado

        # Limpiar el campo y realizar la búsqueda  
        search_field.clear()
        search_field.send_keys(numero_orden)
        search_field.send_keys(Keys.RETURN)
        print(f"{numero_orden} ingresado y búsqueda ejecutada con ENTER.")

        # Esperar resultados
        try:
            WebDriverWait(driver, 5).until(
                EC.any_of(
                    EC.presence_of_element_located((By.CLASS_NAME, "global-search-found-item")),
                    EC.presence_of_element_located((By.XPATH, "//div[contains(text(), 'No se han encontrado resultados')]"))
                )
            )
        except TimeoutException:
            print("⚠️ Tiempo de espera agotado para resultados.")

        time.sleep(0.5)
        
        # Medición de tiempo parcial - Búsqueda
        tiempo_busqueda = time.time() - tiempo_inicio
        print(f"🔍 Búsqueda completada en: {formatear_tiempo(tiempo_busqueda)}")

        resultados = driver.find_elements(By.CLASS_NAME, "global-search-found-item")
        print(f"Resultados encontrados: {len(resultados)}")

        # Buscar resultados y hacer clic en el primero
        encontrado = False
        for elemento in resultados:
            titulo_elemento = elemento.find_element(By.CLASS_NAME, "activity-title")
            titulo = titulo_elemento.text.strip()
            print(f"Resultado encontrado: {titulo}")

            driver.execute_script("arguments[0].scrollIntoView(true);", elemento)
            time.sleep(1)
            
            # Hacer clic en el elemento
            try:
                elemento.click()
                print(f"✅ Clic exitoso en: {titulo}")
                
                # Esperar un momento para que la página se actualice
                time.sleep(2)  # Aumentar el tiempo de espera
                
                # Verificar que estamos en la página correcta esperando algún elemento específico
                try:
                    WebDriverWait(driver, 5).until(
                        EC.presence_of_element_located((By.CLASS_NAME, "card-content"))
                    )
                    print("✅ Página de detalles cargada")
                except:
                    print("⚠️ Página de detalles no cargó completamente")
                
                encontrado = True
                break
            except Exception as e:
                print(f"⚠️ Error al hacer clic normal: {e}")
                try:
                    driver.execute_script("arguments[0].click();", elemento)
                    print(f"✅ Clic con JavaScript exitoso en: {titulo}")
                    time.sleep(2)  # Esperar después del clic
                    encontrado = True
                    break
                except Exception as e2:
                    print(f"❌ Error al hacer clic con JavaScript: {e2}")
                    continue

        if not encontrado:
            resultado["estado"] = "No encontrada"
            resultado["observacion"] = "No se encontró ningún resultado válido"
            return resultado
        # Esperar que cargue la sección completa
        try:
            WebDriverWait(driver, 6).until(
                EC.presence_of_element_located((By.CLASS_NAME, "card-content"))
            )
            print("✅ Pantalla de detalle cargada correctamente")
            
            # Medición de tiempo parcial - Carga de detalle
            tiempo_carga_detalle = time.time() - tiempo_inicio
            print(f"📋 Detalle cargado en: {formatear_tiempo(tiempo_carga_detalle)}")
            
        except Exception as e:
            print(f"❌ Error esperando card-content: {e}")
            resultado["estado"] = "Error"
            resultado["observacion"] = "No se pudo cargar el detalle de la orden"
            return resultado

        print("🔍 Obteniendo datos de la página principal...")
        time.sleep(1) # wait for shadow DOM to settle

        subtipo = get_shadow_text_by_id(driver, "id_index_78").lower()
        if "alta" not in subtipo:
            resultado["estado"] = "No aplicable"
            resultado["observacion"] = f"Subtipo incorrecto: {subtipo}"
            return resultado
        resultado["subtipo"] = subtipo

        estado = get_shadow_text_by_id(driver, "id_index_81")
        resultado["estado"] = estado if estado else "SIN DATOS"

        raw_emision = get_shadow_text_by_id(driver, "id_index_171")
        if raw_emision:
            try:
                fecha_obj = datetime.strptime(raw_emision.split(" ")[0], "%Y/%m/%d")
                resultado["fecha_emision"] = fecha_obj.strftime("%d/%m/%Y")
            except Exception:
                resultado["fecha_emision"] = raw_emision
        else:
            resultado["fecha_emision"] = "SIN FECHA"

        raw_cita = get_shadow_text_by_id(driver, "id_index_172")
        if raw_cita:
            try:
                fecha_obj = datetime.strptime(raw_cita.split(" ")[0], "%d/%m/%y")
                resultado["fecha_agenda"] = fecha_obj.strftime("%d/%m/%Y")
            except Exception:
                resultado["fecha_agenda"] = raw_cita
        else:
            resultado["fecha_agenda"] = "SIN FECHA"

        bloque_horario = get_shadow_text_by_id(driver, "id_index_387")
        if bloque_horario:
            resultado["bloque_horario"] = bloque_horario
        else:
            resultado["bloque_horario"] = "SIN DATOS"

        ventana_llegada = get_shadow_text_by_id(driver, "id_index_177")
        if ventana_llegada:
            resultado["ventana_llegada"] = ventana_llegada
        else:
            resultado["ventana_llegada"] = "SIN DATOS"

        cliente = get_shadow_text_by_id(driver, "id_index_83")
        if cliente:
            resultado["cliente"] = cliente

        rut_cliente = get_shadow_text_by_id(driver, "id_index_82")
        if rut_cliente:
            resultado["rut_cliente"] = rut_cliente

        tecnico_raw = get_shadow_text_by_class(driver, "page-header-description--text")
        if tecnico_raw:
            resultado["tecnico"] = tecnico_raw.split(",")[0].strip()

        try:
            fibra_span = driver.find_element(By.XPATH, '//span[@data-label="custom-text" and @aria-describedby="index_66"]')
            if "SIN VALIDACION TECNICA" in fibra_span.text.upper():
                resultado["fibra"] = "ACTIVIDAD BELIEVE- SIN VALIDACION TECNICA"
        except:
            pass
        # PASO 2: ACCEDER A CONTACTO Y DIRECCIÓN
        print("📍 Accediendo a Contacto y Dirección...")
        try:
            boton_contacto = WebDriverWait(driver, 3).until(
                EC.element_to_be_clickable((By.XPATH, '//a[contains(text(), "Contacto y Dirección")]'))
            )
            driver.execute_script("arguments[0].click();", boton_contacto)

            WebDriverWait(driver, 3).until(
                EC.presence_of_element_located((By.ID, "id_index_40"))
            )
            time.sleep(0.3)

            calle = get_shadow_text_by_id(driver, "id_index_40")
            entre_calles = get_shadow_text_by_id(driver, "id_index_42")
            ciudad = get_shadow_text_by_id(driver, "id_index_45")
            comuna = get_shadow_text_by_id(driver, "id_index_46")

            try:
                Departamento_Block_Casa = get_shadow_text_by_id(driver, "id_index_43")
                Departamento_Block_Casa = f"DEPTO {Departamento_Block_Casa}" if Departamento_Block_Casa and Departamento_Block_Casa != "/" else ""
            except:
                Departamento_Block_Casa = ""

            try:
                piso = get_shadow_text_by_id(driver, "id_index_44")
                piso = f"PISO {piso}" if piso and piso != "/" else ""
            except:
                piso = ""

            direccion_componentes = [calle, Departamento_Block_Casa, piso, entre_calles, ciudad, comuna]
            direccion = ", ".join([c for c in direccion_componentes if c and c.strip() != ""])

            if not direccion:
                direccion = "Sin dirección registrada"

            resultado["direccion"] = direccion

            try:
                tel1 = driver.find_element(By.XPATH, '//a[@data-label="ccell"]').text.strip()
            except:
                tel1 = ""
            try:
                tel2 = driver.find_element(By.XPATH, '//label[@for="id_index_35"]/ancestor::div[@class="form-label-group"]/following-sibling::a').text.strip()
            except:
                tel2 = ""
            try:
                tel3 = driver.find_element(By.XPATH, '//a[@data-label="XA_CONTACT_PHONE_NUMBER_3"]').text.strip()
            except:
                tel3 = ""

            telefonos = " / ".join([t for t in [tel1, tel2, tel3] if t])
            resultado["telefonos"] = telefonos

            print("↩️ Volviendo a la vista principal desde Dirección...")
            try:
                detalle = driver.find_element(By.XPATH, "//button[@title='Detalles de actividad']")
                detalle.click()
                WebDriverWait(driver, 2).until(
                    EC.presence_of_element_located((By.CLASS_NAME, "page-header-description--text"))
                )
            except Exception as e:
                print(f"⚠️ Error al volver a detalles desde dirección: {e}")
                try:
                    driver.get("https://telefonica-cl.etadirect.com/")
                    time.sleep(1)
                    consultar_orden_toa(numero_orden)
                    return resultado
                except:
                    pass
                # Medición de tiempo parcial - Dirección procesada
            tiempo_direccion = time.time() - tiempo_inicio
            print(f"📍 Dirección procesada en: {formatear_tiempo(tiempo_direccion)}")

        except Exception as e:
            print("❌ Error al obtener dirección:", e)

        # PASO 3: VERIFICAR SI NECESITAMOS OBSERVACIONES
        estado = resultado.get("estado", "").lower()
        if "cancelado" in estado or "no realizada" in estado:
            print("📝 Verificando observaciones...")
            obs_links = driver.find_elements(By.XPATH, "//a[contains(text(), 'Observaciones')]")
            if obs_links:
                try:
                    obs_links[0].click()
                    WebDriverWait(driver, 3).until(
                        EC.presence_of_element_located((By.XPATH, "//table[contains(@class, 'Grid')]"))
                    )
                    filas = driver.find_elements(By.XPATH, "//table[contains(@class, 'Grid')]/tbody/tr")[1:]
                    if filas:
                        cols = filas[-1].find_elements(By.TAG_NAME, "td")
                        if len(cols) >= 3:
                            obs = f"{cols[0].text.strip()} | {cols[1].text.strip()} | {cols[2].text.strip()}"
                            resultado["observacion"] = obs
                except Exception as e:
                    print("⚠️ No pude extraer observaciones:", e)
                finally:
                    print("↩️ Volviendo a la vista principal desde Observaciones...")
                    try:
                        detalle = driver.find_element(By.XPATH, "//button[@title='Detalles de actividad']")
                        detalle.click()
                        WebDriverWait(driver, 2).until(
                            EC.presence_of_element_located((By.CLASS_NAME, "page-header-description--text"))
                        )
                    except Exception:
                        pass
# PASO 4: EXTRACCIÓN DE DATOS DEL BOTÓN CIERRE (SOLO PARA ESTADOS ESPECÍFICOS)
        if "completado" in estado or "cancelado" in estado or "no realizada" in estado or "suspendido" in estado:
            try:
                print(f"📋 Consultando información adicional para estado: {estado}")

                boton_cierre = None
                try:
                    boton_cierre = WebDriverWait(driver, 3).until(
                        EC.element_to_be_clickable((By.XPATH, '//a[@class="button inline" and contains(text(), "Cierre")]'))
                    )
                    print("✅ Botón de cierre encontrado por clase e inline")
                except:
                    try:
                        boton_cierre = driver.find_element(By.XPATH, '//a[contains(text(), "Cierre")]')
                        print("✅ Botón de cierre encontrado solo por texto")
                    except:
                        try:
                            boton_cierre = driver.find_element(By.XPATH, '//a[contains(@data-label, "tab")]')
                            print(f"✅ Botón encontrado por data-label: {boton_cierre.text}")
                        except Exception as e:
                            print(f"❌ No se pudo encontrar el botón de cierre: {e}")
                            boton_cierre = None

                if boton_cierre:
                    driver.execute_script("arguments[0].scrollIntoView(true);", boton_cierre)
                    time.sleep(0.3)
                    driver.execute_script("arguments[0].click();", boton_cierre)
                    time.sleep(0.8)

                    if "completado" in estado:
                        try:
                            try:
                                fecha_elemento = driver.find_element(By.ID, "id_index_217")
                                fecha_raw = fecha_elemento.text.strip()
                                print(f"✅ Fecha de término encontrada por ID: {fecha_raw}")
                            except:
                                try:
                                    fecha_elementos = driver.find_elements(By.XPATH, '//div[@data-label="A_AUTHORIZATION_COMPLETE_TSTAMP"]')
                                    if fecha_elementos:
                                        fecha_raw = fecha_elementos[0].text.strip()
                                        print(f"✅ Fecha de término encontrada por data-label: {fecha_raw}")
                                    else:
                                        fecha_elementos = driver.find_elements(By.XPATH, '//div[contains(@data-label, "_TSTAMP") and contains(@id, "id_index_")]')
                                        if fecha_elementos:
                                            fecha_raw = fecha_elementos[0].text.strip()
                                            print(f"✅ Fecha de término encontrada por XPATH genérico: {fecha_raw}")
                                        else:
                                            fecha_raw = ""
                                            print("⚠️ No se encontró fecha de término por ningún método")
                                except Exception as e:
                                    print(f"⚠️ Error en búsqueda alternativa de fecha: {e}")
                                    fecha_raw = ""

                            if fecha_raw:
                                try:
                                    fecha_parte = fecha_raw.split(" ")[0] if " " in fecha_raw else fecha_raw
                                    resultado["fecha_termino"] = fecha_parte
                                except Exception as e:
                                    print(f"⚠️ Error al formatear fecha: {e}")
                                    resultado["fecha_termino"] = fecha_raw
                        except Exception as e:
                            print(f"⚠️ No se pudo obtener la fecha de cierre para Completado: {e}")

                    elif "cancelado" in estado:
                        try:
                            try:
                                fecha_elemento = driver.find_element(By.ID, "id_index_229")
                                fecha_raw = fecha_elemento.text.strip()
                                print(f"✅ Fecha de cancelación encontrada por ID: {fecha_raw}")
                            except:
                                try:
                                    fecha_elementos = driver.find_elements(By.XPATH, '//div[@data-label="A_AUTHORIZATION_CANCEL_TSTAMP"]')
                                    if fecha_elementos:
                                        fecha_raw = fecha_elementos[0].text.strip()
                                        print(f"✅ Fecha de cancelación encontrada por data-label: {fecha_raw}")
                                    else:
                                        fecha_elementos = driver.find_elements(By.XPATH, '//div[contains(@data-label, "CANCEL") and contains(@id, "id_index_")]')
                                        if fecha_elementos:
                                            fecha_raw = fecha_elementos[0].text.strip()
                                            print(f"✅ Fecha de cancelación encontrada por XPATH genérico: {fecha_raw}")
                                        else:
                                            fecha_raw = ""
                                            print("⚠️ No se encontró fecha de cancelación por ningún método")
                                except Exception as e:
                                    print(f"⚠️ Error en búsqueda alternativa de fecha de cancelación: {e}")
                                    fecha_raw = ""

                            if fecha_raw:
                                try:
                                    fecha_parte = fecha_raw.split(" ")[0] if " " in fecha_raw else fecha_raw
                                    resultado["fecha_termino"] = fecha_parte
                                except Exception as e:
                                    print(f"⚠️ Error al formatear fecha de cancelación: {e}")
                                    resultado["fecha_termino"] = fecha_raw
                        except Exception as e:
                            print(f"⚠️ No se pudo obtener la fecha de cancelación: {e}")
                    elif "no realizada" in estado:
                        try:
                            try:
                                tipo_quiebre_elemento = driver.find_element(By.ID, "id_index_189")
                                if tipo_quiebre_elemento:
                                    tipo_quiebre = tipo_quiebre_elemento.text.strip()
                                    resultado["tipo_quiebre"] = tipo_quiebre
                                    print(f"✅ Tipo quiebre encontrado: {tipo_quiebre}")
                            except:
                                try:
                                    elementos_tipo = driver.find_elements(By.XPATH, '//div[@data-label="A_NOT_DONE_INST_FAM"]')
                                    if elementos_tipo:
                                        tipo_quiebre = elementos_tipo[0].text.strip()
                                        resultado["tipo_quiebre"] = tipo_quiebre
                                        print(f"✅ Tipo quiebre encontrado por data-label: {tipo_quiebre}")
                                    else:
                                        print("⚠️ No se encontró tipo quiebre por data-label")
                                except Exception as e:
                                    print(f"⚠️ Error al buscar tipo de quiebre por métodos alternativos: {e}")

                            try:
                                razon_quiebre_elemento = driver.find_element(By.ID, "id_index_190")
                                if razon_quiebre_elemento:
                                    razon_quiebre = razon_quiebre_elemento.text.strip()
                                    resultado["razon_quiebre"] = razon_quiebre
                            except:
                                try:
                                    elementos_razon = driver.find_elements(By.XPATH, '//div[@data-label="XA_NOT_DONE_REASON_INSTALL"]')
                                    if elementos_razon:
                                        razon_quiebre = elementos_razon[0].text.strip()
                                        resultado["razon_quiebre"] = razon_quiebre
                                except Exception as e:
                                    print(f"⚠️ No se encontró razón de quiebre: {e}")

                            try:
                                fecha_elements = driver.find_elements(By.ID, "id_index_221")
                                if fecha_elements:
                                    fecha_raw = fecha_elements[0].text.strip()
                                    fecha_parte = fecha_raw.split(" ")[0] if " " in fecha_raw else fecha_raw
                                    resultado["fecha_termino"] = fecha_parte
                            except Exception as e:
                                print(f"⚠️ No se pudo obtener fecha para No Realizada: {e}")
                        except Exception as e:
                            print(f"⚠️ Error al obtener información de quiebre: {e}")

                    elif "suspendido" in estado:
                        try:
                            razon_suspension = driver.find_element(By.ID, "id_index_194").text.strip()
                            if razon_suspension:
                                resultado["observacion"] = razon_suspension
                        except Exception as e:
                            print(f"⚠️ No se pudo obtener razón de suspensión: {e}")

                    try:
                        obs_elementos = driver.find_elements(By.XPATH, '//div[@data-label="A_OBSERVACIONES"]')
                        if obs_elementos:
                            obs_adicional = obs_elementos[0].text.strip()
                            if obs_adicional:
                                if resultado["observacion"] == "ORDEN SIN OBSERVACIÓN":
                                    resultado["observacion"] = obs_adicional
                                else:
                                    resultado["observacion"] = f"{resultado['observacion']} / {obs_adicional}"
                                print(f"✅ Observación adicional encontrada: {obs_adicional}")
                    except Exception as e:
                        print(f"⚠️ No se encontraron observaciones adicionales: {e}")
                        try:
                            obs_elementos = driver.find_elements(By.XPATH, '//div[contains(@class, "cl-static-html") and contains(@aria-describedby, "index_")]')
                            for elem in obs_elementos:
                                if elem.text.strip():
                                    obs_adicional = elem.text.strip()
                                    if resultado["observacion"] == "ORDEN SIN OBSERVACIÓN":
                                        resultado["observacion"] = obs_adicional
                                    else:
                                        resultado["observacion"] = f"{resultado['observacion']} / {obs_adicional}"
                                    print(f"✅ Observación alternativa encontrada: {obs_adicional}")
                                    break
                        except Exception as e2:
                            print(f"⚠️ Tampoco se encontró observación alternativa: {e2}")

                    print("✅ Procesamiento de Cierre completado - permaneciendo en la pantalla actual")
                     
                    # Medición de tiempo parcial - Cierre procesado
                    tiempo_cierre = time.time() - tiempo_inicio
                    print(f"📝 Cierre procesado en: {formatear_tiempo(tiempo_cierre)}")

            except Exception as e:
                print(f"⚠️ Error al consultar información de cierre: {e}")

    except Exception as e:
        print(f"❌ Error grave en la consulta: {str(e)}")
        resultado["estado"] = "Error"
        resultado["observacion"] = f"Error general: {str(e)}"

        if resultado.get("estado") == "Error":
            try:
                print("🔄 Reintentando la consulta completa...")
                verificar_sesion()
                time.sleep(1)
                if "Reintento" not in resultado.get("observacion", ""):
                    try:
                        resultado["observacion"] += " (Reintento)"
                        resultado_reintento = consultar_orden_toa(numero_orden)
                        if resultado_reintento.get("estado") != "Error":
                            return resultado_reintento
                    except Exception as retry_e:
                        print(f"❌ Error en reintento: {retry_e}")
            except Exception as outer_e:
                print(f"❌ Error preparando reintento: {outer_e}")
    
    # ELIMINAR TODA LA SECCIÓN DE CONSOLA DE DESPACHO
    # NO NAVEGAR A NINGUNA PÁGINA - Solo registrar el tiempo y retornar
    
    tiempo_total = time.time() - tiempo_inicio
    print(f"⏱️ Tiempo total de consulta: {formatear_tiempo(tiempo_total)}")
    resultado["tiempo_consulta"] = tiempo_total
    
    # Actualizar tiempo de última actividad
    last_activity_time = time.time()
    
    return resultado

def lock_and_run(numero_orden):
    """
    Función que implementa un mecanismo de bloqueo robusto con auto-limpieza y
    resistencia a interrupciones.
    """
    lock_file = "lock.tmp"
    
    # VERIFICACIÓN INICIAL: ¿El archivo de bloqueo es antiguo o inválido?
    if os.path.exists(lock_file):
        try:
            # ¿El archivo es antiguo? (más de 5 minutos)
            file_time = os.path.getmtime(lock_file)
            current_time = time.time()
            if current_time - file_time > 300:  # 5 minutos
                print(f"⚠️ Detectado bloqueo antiguo. Eliminando...")
                os.remove(lock_file)
                print(f"✅ Bloqueo antiguo eliminado")
            else:
                # Verificar si el contenido del archivo es válido
                try:
                    with open(lock_file, "r") as f:
                        content = f.read().strip()
                    # Si el archivo está vacío o tiene contenido inválido
                    if not content or len(content) < 3:
                        print(f"⚠️ Detectado bloqueo inválido. Eliminando...")
                        os.remove(lock_file)
                except:
                    # Si no se puede leer el archivo, eliminarlo
                    print(f"⚠️ No se pudo leer el bloqueo. Eliminando...")
                    os.remove(lock_file)
        except Exception as e:
            print(f"⚠️ Error verificando bloqueo: {e}")
    
    # Generar un ID único para esta solicitud y timestamp
    import uuid
    request_id = str(uuid.uuid4())[:8]
    timestamp = str(int(time.time()))
    
    # Esperar si el archivo de bloqueo existe
    max_wait_time = 60  # Tiempo máximo de espera en segundos
    start_wait_time = time.time()
    wait_count = 0
    
    while os.path.exists(lock_file):
        wait_count += 1
        print(f"🕒 [{request_id}] Esperando turno para consultar... (intento {wait_count})")
        
        # Verificar si hemos esperado demasiado tiempo
        if time.time() - start_wait_time > max_wait_time:
            print(f"⚠️ [{request_id}] Tiempo máximo de espera excedido (60s). Forzando liberación...")
            try:
                os.remove(lock_file)
                print(f"✅ [{request_id}] Bloqueo liberado por tiempo excedido")
                break
            except Exception as e:
                print(f"❌ [{request_id}] No se pudo liberar bloqueo: {e}")
                # En este punto, mejor levantar una excepción que continuar en bucle infinito
                raise Exception(f"No se pudo liberar bloqueo después de {max_wait_time} segundos")
        
        # Dormir antes de verificar nuevamente
        time.sleep(2)
        
        # Verificar si el archivo de bloqueo es antiguo cada 10 segundos
        if wait_count % 5 == 0:  # Cada 10 segundos (5 * 2s)
            try:
                file_time = os.path.getmtime(lock_file)
                if time.time() - file_time > 300:  # 5 minutos
                    print(f"⚠️ [{request_id}] Detectado bloqueo antiguo durante espera. Eliminando...")
                    try:
                        os.remove(lock_file)
                        print(f"✅ [{request_id}] Bloqueo antiguo eliminado durante espera")
                        break
                    except:
                        print(f"❌ [{request_id}] No se pudo eliminar bloqueo antiguo durante espera")
            except:
                pass
    
    # Crear archivo de bloqueo con información
    try:
        with open(lock_file, "w") as f:
            lock_info = f"{request_id}-{timestamp}-{numero_orden}"
            f.write(lock_info)
        print(f"🔒 [{request_id}] Bloqueo adquirido para orden {numero_orden}")
    except Exception as e:
        print(f"⚠️ [{request_id}] Error creando archivo de bloqueo: {e}")
    
    # Ejecutar la consulta
    try:
        print(f"▶️ [{request_id}] Iniciando consulta para orden {numero_orden}")
        # CAMBIO IMPORTANTE: Usar la versión segura si la has implementado
        # Si has implementado consultar_orden_toa_seguro, usa:
        # resultado = consultar_orden_toa_seguro(numero_orden)
        # Si no, sigue usando:
        resultado = consultar_orden_toa(numero_orden)
        print(f"✅ [{request_id}] Consulta completada para orden {numero_orden}")
        
        # Registrar estadísticas
        try:
            registrar_estadisticas(resultado)
        except Exception as e:
            print(f"⚠️ [{request_id}] Error registrando estadísticas: {e}")
            
        return resultado
    except Exception as e:
        print(f"❌ [{request_id}] Error durante la consulta: {e}")
        raise e
    finally:
        # Siempre intentar eliminar el archivo de bloqueo si nos pertenece
        try:
            if os.path.exists(lock_file):
                # Verificar que el bloqueo aún sea nuestro
                try:
                    with open(lock_file, "r") as f:
                        lock_content = f.read().strip()
                    if lock_content.startswith(f"{request_id}-"):
                        os.remove(lock_file)
                        print(f"🔓 [{request_id}] Bloqueo liberado para orden {numero_orden}")
                    else:
                        print(f"⚠️ [{request_id}] El bloqueo ya no nos pertenece, no se elimina")
                except:
                    # Si no podemos verificar, intentamos eliminar de todos modos
                    # ya que es mejor arriesgarse a eliminar un bloqueo ajeno
                    # que dejar un bloqueo huérfano
                    try:
                        os.remove(lock_file)
                        print(f"🔓 [{request_id}] Bloqueo liberado sin verificación")
                    except:
                        pass
        except Exception as e:
            print(f"⚠️ [{request_id}] Error al liberar bloqueo: {e}")
        
        # NUEVO: Actualizar tiempo de última actividad
        global last_activity_time
        last_activity_time = time.time()
        print(f"🕐 [{request_id}] Tiempo de actividad actualizado")


# BLOQUEO AVANZADO: También puedes implementar un sistema de rescate al inicio de tu script
# que verifique y elimine bloqueos huérfanos antes de empezar

def verificar_bloqueos_huerfanos():
    """
    Función para verificar y eliminar bloqueos huérfanos al inicio del script
    """
    lock_file = "lock.tmp"
    
    if os.path.exists(lock_file):
        print("🔍 Verificando si existe un bloqueo huérfano...")
        try:
            # Verificar antigüedad
            file_time = os.path.getmtime(lock_file)
            current_time = time.time()
            file_age = current_time - file_time
            
            if file_age > 300:  # 5 minutos
                print(f"⚠️ Detectado bloqueo antiguo de {int(file_age)} segundos. Eliminando...")
                os.remove(lock_file)
                print("✅ Bloqueo antiguo eliminado al inicio")
            else:
                print(f"📌 Existe un bloqueo reciente de {int(file_age)} segundos.")
                # Opcional: solicitar confirmación para eliminar
                print("❓ Si estás seguro de que no hay otra instancia en ejecución,")
                print("   puedes eliminar manualmente el archivo 'lock.tmp' y reiniciar el script.")
        except Exception as e:
            print(f"⚠️ Error verificando bloqueo huérfano: {e}")

# Llama a esta función al inicio de tu script principal:
# verificar_bloqueos_huerfanos()

# FUNCIÓN MEJORADA PARA CERRAR EL DRIVER
def cerrar_driver():
    """Cierra el driver de forma segura"""
    global driver, last_activity_time
    
    if driver:
        try:
            driver.quit()
            print("✅ Driver cerrado correctamente")
        except Exception as e:
            print(f"⚠️ Error al cerrar driver: {e}")
        finally:
            driver = None
            last_activity_time = None
