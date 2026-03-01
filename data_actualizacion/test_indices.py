import json, time, os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from dotenv import load_dotenv

load_dotenv()

options = webdriver.ChromeOptions()
options.add_argument("--headless=new")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
options.add_argument("--window-size=1920,1080")
driver = webdriver.Chrome(options=options)

driver.get("https://telefonica-cl.etadirect.com/")
WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.ID, "username")))
driver.find_element(By.ID, "username").send_keys(os.getenv("TOA_USERNAME"))
driver.find_element(By.ID, "password").send_keys(os.getenv("TOA_PASSWORD"))
driver.find_element(By.ID, "sign-in").click()

time.sleep(2)
try:
    delsession_checkbox = driver.find_element(By.ID, "delsession")
    if not delsession_checkbox.is_selected():
        delsession_checkbox.click()
    password = driver.find_element(By.ID, "password")
    password.clear()
    password.send_keys(os.getenv("TOA_PASSWORD"))
    driver.find_element(By.ID, "sign-in").click()
except:
    pass

time.sleep(6)
search_icon = WebDriverWait(driver, 10).until(
    EC.element_to_be_clickable((By.CLASS_NAME, "action-global-search-icon"))
)
driver.execute_script("arguments[0].click();", search_icon)
search_field = WebDriverWait(driver, 5).until(
    EC.element_to_be_clickable((By.XPATH, "//input[contains(@class, 'search-bar-input') and @type='search']"))
)
search_field.clear()
search_field.send_keys("1233458313")
search_field.send_keys(Keys.RETURN)

time.sleep(3)
resultados = driver.find_elements(By.CLASS_NAME, "global-search-found-item")
for el in resultados:
    driver.execute_script("arguments[0].click();", el)
    break

time.sleep(12)

# JS to find all elements with IDs starting with 'id_index_' or 'index_' 
# and extract their text OR value
js = """
function collectAll(node, obj) {
    if (node.id && node.id.includes('index_')) {
        obj.push({
            id: node.id,
            tag: node.tagName,
            class: node.className,
            text: node.textContent.trim(),
            value: node.value || ''
        });
    }
    if (node.shadowRoot) collectAll(node.shadowRoot, obj);
    if (node.childNodes) {
        node.childNodes.forEach(child => collectAll(child, obj));
    }
}
let res = [];
collectAll(document.body, res);
return res;
"""
data = driver.execute_script(js)

with open("toa_indices.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"Extracted {len(data)} fields to toa_indices.json")
driver.quit()
