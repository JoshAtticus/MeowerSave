import os
import time
import subprocess
import json

# Get the current time
current_time = time.time()

# Iterate through the files in the 'users' directory
for filename in os.listdir('users'):
    if filename.endswith('.json'):
        filepath = os.path.join('users', filename)

        # Load the JSON data from the file
        with open(filepath, 'r') as f:
            data = json.load(f)

        # Get the crawl timestamp from the data
        crawl_timestamp = data['user_info']['crawl_timestamp']

        # Check if the crawl timestamp is over 72 hours ago
        if current_time - crawl_timestamp > 72 * 60 * 60:
            # Get the usernames related to the data
            usernames = [data['user_info']['_id']]

            # Run the save.py script to update the data
            subprocess.run(['python3', 'save.py', '--usernames'] + usernames)

            # Update the crawl timestamp in the data
            data['user_info']['crawl_timestamp'] = time.time()

            # Save the updated data back to the file
            with open(filepath, 'w') as f:
                json.dump(data, f, indent=4)
