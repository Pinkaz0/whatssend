from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
import time, os, json
from dotenv import load_dotenv

load_dotenv()

options = webdriver.ChromeOptions()
options.add_argument("--headless=new")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
options.add_argument("--window-size=1920,1080")
driver = webdriver.Chrome(options=options)

print("Iniciando login...")
driver.get("https://telefonica-cl.etadirect.com/")
WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.ID, "username")))
driver.find_element(By.ID, "username").send_keys(os.getenv("TOA_USERNAME"))
driver.find_element(By.ID, "password").send_keys(os.getenv("TOA_PASSWORD"))
driver.find_element(By.ID, "sign-in").click()
time.sleep(5)

try:
    search_icon = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.CLASS_NAME, "action-global-search-icon"))
    )
    driver.execute_script("arguments[0].click();", search_icon)
    search_field = WebDriverWait(driver, 5).until(
        EC.element_to_be_clickable((By.XPATH, "//input[contains(@class, 'search-bar-input') and @type='search']"))
    )
except:
    search_field = driver.find_element(By.XPATH, "//input[contains(@class, 'search-bar-input') and @type='search']")

search_field.clear()
search_field.send_keys("1233458313")
search_field.send_keys(Keys.RETURN)

time.sleep(5)
resultados = driver.find_elements(By.CLASS_NAME, "global-search-found-item")
print(f"Resultados encontrados: {len(resultados)}")

for el in resultados:
    driver.execute_script("arguments[0].click();", el)
    break

time.sleep(10)

def find_shadow_id(id):
    try:
        el = driver.find_element(By.ID, id)
        print(f"ID {id}: {el.text}")
    except Exception as e:
        print(f"ID {id} not found by find_element. Trying JS...")
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
        return el ? el.textContent.trim() : null;
        """
        val = driver.execute_script(js, id)
        print(f"ID {id} (JS): {val}")

find_shadow_id("id_index_78") # Subtipo
find_shadow_id("id_index_80") # Tipo Trabajo
find_shadow_id("id_index_81") # Estado
find_shadow_id("id_index_82") # Rut
find_shadow_id("id_index_83") # Cliente
find_shadow_id("id_index_168") # Fecha Emision
find_shadow_id("id_index_169") # Fecha Agenda
find_shadow_id("id_index_384") # Bloque

driver.quit()
