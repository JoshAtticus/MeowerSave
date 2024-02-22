import argparse
import requests
import json
import os
import time
from concurrent.futures import ThreadPoolExecutor
import gc
from alive_progress import alive_bar

parser = argparse.ArgumentParser()
parser.add_argument('--usernames', type=str, help='Specify usernames to scrape')
args = parser.parse_args()

usernames = args.usernames.split(',') if args.usernames else []

if not usernames:
    usernames = input("Enter the usernames separated by commas: ").split(',')

if not os.path.exists('users'):
    os.makedirs('users')

for username in usernames:
    username = username.strip()
    page = 1
    posts = []
    user_info = {}

    response = requests.get(f'https://api.meower.org/users/{username}/posts?autoget=1&page={page}')

    if response.status_code == 404:
        print(f"User {username} does not exist.")
        continue

    data = response.json()
    if 'pages' not in data:
        print(f"User {username} does not exist.")
        continue

    total_pages = data['pages']
    with alive_bar(total_pages) as progress:
        response = requests.get(f'https://api.meower.org/users/{username}')
        user_info = response.json()
        user_info['crawl_timestamp'] = time.time()

        def fetch_posts(page):
            response = requests.get(f'https://api.meower.org/users/{username}/posts?autoget=1&page={page}')
            data = response.json()
            for post in data['autoget']:
                post_info = {
                    'content': post['p'],
                    'post_id': post['_id'],
                    'username': post['u'],
                    'timestamp': post['t']['e']
                }
                posts.append(post_info)
                print(f"Saved post {post['_id']}")
            progress()

        with ThreadPoolExecutor(max_workers=10) as executor:
            executor.map(fetch_posts, range(1, total_pages + 1))

    with open(os.path.join('users', f'{username}.json'), 'w') as f:
        json.dump({'user_info': user_info, 'posts': posts}, f, indent=4)

    posts = []
    gc.collect()
