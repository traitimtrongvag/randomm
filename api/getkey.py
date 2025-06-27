import os

def handler(request, response):
    file_path = os.path.join(os.path.dirname(__file__), '../keys.txt')

    try:
        with open(file_path, "r") as f:
            keys = f.readlines()

        if not keys:
            return response.json({"error": "No keys left"}, status=404)

        key = keys[0].strip()
        remaining = keys[1:]

        with open(file_path, "w") as f:
            f.writelines(remaining)

        return response.json({"key": key})
    
    except Exception as e:
        return response.json({"error": str(e)}, status=500)
