import requests
from bs4 import BeautifulSoup
import sys


def getLocation(dominio):
    url = "https://www.dnrpa.gov.ar/portal_dnrpa/radicacion/consinve_amq.php"

    payload = f"dominio={dominio}"
    headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "es-US,es-419;q=0.9,es;q=0.8,en;q=0.7",
        "Cache-Control": "max-age=0",
        "Connection": "keep-alive",
        "Content-Length": "33",
        "Content-Type": "application/x-www-form-urlencoded",
        "Host": "www.dnrpa.gov.ar",
        "Origin": "https://www.dnrpa.gov.ar",
        "Referer": "https://www.dnrpa.gov.ar/portal_dnrpa/radicacion2.php",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
        "sec-ch-ua": '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "Windows"
    }

    response = requests.post(url, data=payload, headers=headers)

    scrape = BeautifulSoup(response.text, "html.parser")

    secs = scrape.find_all("table")[3]
    fonts = secs.find_all("font")
    localidad = fonts[1].text.strip()
    provincia = fonts[3].text.strip()

    dictionary = {"localidad": localidad,
                  "provincia": provincia}

    return dictionary


dominio = sys.argv[1]
print(getLocation(dominio))
sys.argv = [sys.argv[0]]
sys.stdout.flush()
