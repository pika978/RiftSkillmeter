import requests
import json

API_KEY = "AIzaSyA98duwWN_9PKaaYmPY0K9WxpzTrPaxcdU"

def search_video(query):
    print(f"Testing query: {query}")
    try:
        url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            'part': 'snippet',
            'q': query,
            'type': 'video',
            'maxResults': 1,
            'key': API_KEY
        }
        response = requests.get(url, params=params, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"Error Response: {response.text}")
            return

        data = response.json()
        print("JSON Parsed.")
        
        if 'items' in data and len(data['items']) > 0:
            item = data['items'][0]
            video_id = item['id']['videoId']
            print(f"Success! Video ID: {video_id}")
        else:
            print("No items found.")
            print(data)

    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    search_video("React Tutorial")
