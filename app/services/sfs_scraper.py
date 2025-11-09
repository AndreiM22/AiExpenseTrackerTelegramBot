"""
SFS Moldova Receipt Scraper
Scrapes receipt data from https://mev.sfs.md/receipt-verifier/
"""
import httpx
from bs4 import BeautifulSoup
import re
import logging
from datetime import datetime
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


class SFSScraper:
    def __init__(self):
        self.base_url = "https://mev.sfs.md/receipt-verifier"

    def _build_candidate_urls(self, qr_url: str) -> list[str]:
        candidates = []
        if not qr_url:
            return candidates

        qr_url = qr_url.strip()
        if qr_url:
            candidates.append(qr_url)

        try:
            parsed = urlparse(qr_url)
            path = parsed.path or ""
            code = None
            if "/receipt-verifier/" in path:
                code = path.split("/receipt-verifier/")[-1].strip("/")
            elif "/receipt/" in path:
                code = path.split("/receipt/")[-1].strip("/")

            if code:
                candidates.append(f"https://mev.sfs.md/receipt-verifier/{code}")
                candidates.append(f"https://mev.sfs.md/receipt-verifier/{code}/")
                candidates.append(f"https://sift-mev.sfs.md/receipt/{code}")
        except Exception:
            pass

        seen = set()
        unique = []
        for url in candidates:
            if url and url not in seen:
                seen.add(url)
                unique.append(url)
        return unique

    async def parse_qr_url(self, qr_url: str) -> dict:
        """
        Parse receipt from SFS QR code URL

        Example URL: https://mev.sfs.md/receipt-verifier/H902005680/6049.00/1941/2025-02-11

        Args:
            qr_url: Full URL from QR code

        Returns:
            dict with parsed expense data
        """
        try:
            logger.info(f"Parsing SFS receipt: {qr_url}")

            # Headers to mimic a real browser
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Cache-Control': 'max-age=0'
            }

            response_text = None
            last_error = None

            candidate_urls = self._build_candidate_urls(qr_url)
            if not candidate_urls:
                raise ValueError("Invalid QR URL")

            async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
                for candidate in candidate_urls:
                    try:
                        logger.info(f"Trying SFS URL: {candidate}")
                        response = await client.get(candidate, headers=headers)
                        response.raise_for_status()
                        response_text = response.text
                        break
                    except Exception as e:
                        last_error = e

            if response_text is None:
                if last_error:
                    raise last_error
                raise ValueError("Nu am putut accesa bonul SFS.")

            # Parse HTML
            soup = BeautifulSoup(response_text, 'html.parser')

            # Extract company info
            company_name = None
            fiscal_code = None
            address = None
            registration_number = None

            # Find all text elements
            text_elements = soup.find_all('p', class_='text-gray-600')

            for elem in text_elements:
                text = elem.get_text(strip=True)

                if 'COD FISCAL' in text:
                    fiscal_code = text.replace('COD FISCAL:', '').strip()
                elif 'NUMARUL DE ÎNREGISTRARE' in text or 'NUMĂRUL DE ÎNREGISTRARE' in text:
                    registration_number = text.split(':')[-1].strip()
                elif not company_name and text and not text.startswith('`') and len(text) > 5:
                    # First non-empty text is usually company name
                    if 'S.R.L.' in text or 'S.A.' in text or 'I.I.' in text:
                        company_name = text
                elif 'mun.' in text or 'str.' in text.lower():
                    address = text

            # Extract items
            items = []
            total_amount = 0.0
            currency = "MDL"
            pending_item = None

            # Find all product lines
            item_divs = soup.find_all('div', class_='flex justify-between items-center')

            for div in item_divs:
                spans = div.find_all('span')
                if len(spans) != 2:
                    continue

                raw_name = spans[0].get_text(strip=True)
                raw_value = spans[1].get_text(strip=True)
                name_text = re.sub(r'^\s*\d+[A-Za-z]*[-\s]+', '', raw_name).strip() or raw_name.strip()
                value_text = raw_value.replace('\xa0', ' ').strip()

                # Product line with quantity x price
                if 'x' in value_text and name_text and not name_text.upper().startswith('TVA'):
                    qty_price = self._parse_quantity_price(value_text)
                    if qty_price:
                        qty, price = qty_price
                        pending_item = {
                            "name": name_text,
                            "qty": qty,
                            "price": price
                        }
                    continue

                # Some receipts show line totals right after the product line
                if pending_item and not name_text and value_text:
                    total_value, detected_currency = self._parse_amount(value_text)
                    if total_value is not None:
                        pending_item["total"] = total_value
                        if detected_currency:
                            currency = detected_currency
                        items.append(pending_item)
                        pending_item = None
                    continue

                # Fallback if no separate total line exists
                if pending_item and name_text:
                    items.append(pending_item)
                    pending_item = None

                # Extract overall total
                if name_text.upper() == 'TOTAL':
                    total_value, detected_currency = self._parse_amount(value_text or name_text)
                    if total_value is not None:
                        total_amount = total_value
                    if detected_currency:
                        currency = detected_currency

            if pending_item:
                items.append(pending_item)

            # Extract date and time
            purchase_date = None
            purchase_time = None

            for div in item_divs:
                spans = div.find_all('span')
                if len(spans) == 2:
                    name_text = spans[0].get_text(strip=True)
                    value_text = spans[1].get_text(strip=True)

                    if 'DATA' in name_text:
                        # Parse date like "DATA 11.02.2025"
                        date_match = re.search(r'(\d{2}\.\d{2}\.\d{4})', name_text)
                        if date_match:
                            date_str = date_match.group(1)
                            try:
                                purchase_date = datetime.strptime(date_str, '%d.%m.%Y').strftime('%Y-%m-%d')
                            except:
                                pass

                    if 'ORA' in name_text or 'ORA' in value_text:
                        # Extract time
                        time_match = re.search(r'(\d{2}:\d{2}:\d{2})', value_text)
                        if time_match:
                            purchase_time = time_match.group(1)

            # Determine category based on items
            category = self._determine_category(items, company_name)

            # Build result
            result = {
                "amount": total_amount,
                "currency": currency,
                "vendor": company_name or "Unknown",
                "purchase_date": purchase_date or datetime.now().strftime('%Y-%m-%d'),
                "category": category,
                "items": items,
                "notes": f"Bon fiscal {registration_number}" if registration_number else "Bon fiscal",
                "language": "ro",
                "confidence": 1.0,  # Perfect confidence - official government data!
                "fiscal_code": fiscal_code,
                "registration_number": registration_number,
                "address": address
            }

            logger.info(f"Successfully parsed SFS receipt: {company_name} - {total_amount} MDL")
            return result

        except Exception as e:
            logger.error(f"Error parsing SFS receipt: {str(e)}", exc_info=True)
            raise

    def _clean_number(self, value: str) -> float | None:
        if not value:
            return None
        cleaned = value.replace('\xa0', '').replace(' ', '')
        # Keep minus sign and separators
        cleaned = re.sub(r'[^0-9,.\-]', '', cleaned)
        if cleaned.count(',') > 1 and '.' not in cleaned:
            cleaned = cleaned.replace(',', '')
        cleaned = cleaned.replace(',', '.')
        if cleaned.count('.') > 1:
            parts = cleaned.split('.')
            cleaned = ''.join(parts[:-1]) + '.' + parts[-1]
        try:
            return float(cleaned)
        except ValueError:
            return None

    def _parse_quantity_price(self, text: str) -> tuple[float, float] | None:
        parts = text.lower().split('x')
        if len(parts) != 2:
            return None
        qty = self._clean_number(parts[0])
        price = self._clean_number(parts[1])
        if qty is None or price is None:
            return None
        return qty, price

    def _parse_amount(self, text: str) -> tuple[float | None, str | None]:
        if not text:
            return None, None

        upper_text = text.upper()
        currency = None
        if 'MDL' in upper_text or 'LEI' in upper_text or upper_text.endswith(' B') or upper_text.endswith('B'):
            currency = 'MDL'

        amount = self._clean_number(text)
        return amount, currency

    def _determine_category(self, items: list, vendor: str) -> str:
        """Determine category based on items and vendor"""

        vendor_lower = (vendor or "").lower()

        # Food keywords
        food_vendors = ['linella', 'nr1', 'fidesco', 'green hills', 'kaufland', 'metro']
        if any(v in vendor_lower for v in food_vendors):
            return "Mâncare & Restaurante"

        # Electronics
        electronics_keywords = ['garmin', 'camera', 'dash cam', 'microsd', 'electronics', 'tech']
        if any(keyword in vendor_lower for keyword in electronics_keywords):
            return "Electronice"

        for item in items:
            item_name = item.get('name', '').lower()
            if any(keyword in item_name for keyword in electronics_keywords):
                return "Electronice"

        # Pharmacy
        pharmacy_keywords = ['farmacie', 'pharmacy', 'medicament']
        if any(keyword in vendor_lower for keyword in pharmacy_keywords):
            return "Sănătate"

        # Gas station
        gas_keywords = ['petrom', 'lukoil', 'bemol', 'benzina']
        if any(keyword in vendor_lower for keyword in gas_keywords):
            return "Transport"

        # Default
        return "Cumpărături"


sfs_scraper = SFSScraper()
