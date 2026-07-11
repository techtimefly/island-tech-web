import json
import subprocess

records = [
    "10.0.10.20 islandtech.lan",
    "10.0.10.20 mobilemeridian.lan",
    "10.0.10.20 mobilemeridianco.lan",
    "10.0.10.20 notary.mobilemeridian.lan",
    "10.0.10.20 weddings.mobilemeridian.lan",
    "10.0.10.20 courier.mobilemeridian.lan",
]

current = subprocess.check_output(
    ["pihole-FTL", "--config", "dns.hosts"],
    text=True,
).strip()

if not (current.startswith("[") and current.endswith("]")):
    raise SystemExit(f"unexpected dns.hosts format: {current}")

items = [item.strip() for item in current[1:-1].split(",") if item.strip()]
for record in records:
    if record not in items:
        items.append(record)

updated = json.dumps(items)
subprocess.check_call(["pihole-FTL", "--config", "dns.hosts", updated])
print(f"dns.hosts now has {len(items)} records")
