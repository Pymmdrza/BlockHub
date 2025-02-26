from flask import Flask, request, jsonify
import requests, random

app = Flask(__name__)

useragents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/237.84.2.178 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:106.0) Gecko/20100101 Firefox/106.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/237.84.2.178 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/237.84.2.178 Safari/537.36",
]


def get_address(address: str):
    url_ = f"https://btcbook.guarda.co/api/v2/address/{address}?details=txs"
    headers = {"User-Agent": random.choice(useragents)}
    req = requests.get(url_, headers=headers)
    if req.status_code == 200:
        return req.json()
    return None


def get_txs(txid: str):
    url_ = f"https://btcbook.guarda.co/api/v2/tx/{txid}?page=1"
    headers = {"User-Agent": random.choice(useragents)}
    req = requests.get(url_, headers=headers)
    if req.status_code == 200:
        return req.json()
    return None

@app.route("/")
def index():
    content = {
        "name": "BlockHub",
        "run": "./route.sh",
        "port": "9000",
        "stream": True,
        "datasets": True,
        "api": True
    }
    return jsonify(content)


@app.route("/api/<path:path>", methods=["GET"]) # Changed to /api/<path:path>
def api_proxy(path):
    if request.method == 'GET':
        address = request.args.get('address')
        txid = request.args.get('txid')

        if address:
            result = get_address(address)
            if result:
                return jsonify(result)
            else:
                return jsonify({"error": "Address not found"}), 404
        elif txid:
            result = get_txs(txid)
            if result:
                return jsonify(result)
            else:
                return jsonify({"error": "Transaction not found"}), 404
        else:
            return jsonify({"error": "Invalid request"}), 400

    return jsonify({"error": "Method not allowed"}), 405

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9000)