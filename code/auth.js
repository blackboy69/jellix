const tokenKey = 'accessToken';
const device = 'Device';
const client = 'Jellix';
const client_version = '0.0.1';
var device_id = localStorage.getItem('deviceId');

function generateRandomString(length) {
  return [...Array(length)].map(() => Math.random().toString(36)[2]).join('');
}
/**
 * Retrieves the Jellyfin Access Token from local storage by matching the server's
 * address with the current page's hostname.
 *
 * This function reads the 'jellyfin_credentials' object, gets the current hostname from
 * `window.location.hostname`, and then searches the `Servers` array for an entry
 * whose `ManualAddress` corresponds to that hostname. It includes error handling
 * for missing data or parsing failures.
 *
 * @returns {string|null} The access token for the matching server as a string,
 * or null if no matching server is found, the credentials don't exist, or an
 * error occurs.
 */
function getJellyfinAccessTokenByHostname() {
  try {
    // 1. Retrieve and parse the credentials from local storage.
    const credentialsString = localStorage.getItem('jellyfin_credentials');
    if (!credentialsString) {
      console.error("No 'jellyfin_credentials' found in local storage.");
      return null;
    }
    const credentials = JSON.parse(credentialsString);

    // 2. Get the current hostname from the browser's URL.
    const currentHostname = window.location.hostname;

    // 3. Find the server object that matches the current hostname.
    // The URL object safely parses the address to extract the hostname for comparison.
    const matchingServer = credentials?.Servers?.find(server => {
      if (!server.ManualAddress) {
        return false;
      }
      try {
        const serverHostname = new URL(server.ManualAddress).hostname;
        return serverHostname === currentHostname;
      } catch (e) {
        // Handle cases where ManualAddress is not a valid URL
        console.warn(`Invalid URL for server '${server.Name}':`, server.ManualAddress);
        return false;
      }
    });

    // 4. Return the AccessToken from the matched server.
    if (matchingServer) {
      return matchingServer.AccessToken;
    } else {
      console.error(`No server found matching the current hostname: '${currentHostname}'`);
      return null;
    }

  } catch (error) {
    // 5. Catch any errors during the process.
    console.error("Failed to get Jellyfin Access Token:", error);
    return null;
  }
}

// Generate device ID
if (!device_id) {
  device_id = generateRandomString(16);
  localStorage.setItem('deviceId', device_id);
}

// Check if user is already logged in
const jxAccessToken = localStorage.getItem(tokenKey);
const jfAccessToken = getJellyfinAccessTokenByHostname();
const accessToken = jfAccessToken || jxAccessToken;

function verifyToken(token, onSuccess, onError) {
  fetch(`${API_URL}Users/Me`, {
    method: 'GET',
    headers: {
      'Authorization': `MediaBrowser Client="${client}", Device="${device}", DeviceId="${device_id}", Version="${client_version}", Token="${token}"`
    }
  })
  .then(response => {
    if (response.ok) {
      return response.json();
    } else {
      throw new Error('Token verification failed');
    }
  })
  .then(data => {
    onSuccess(data); // Call success callback
  })
  .catch(error => {
    localStorage.removeItem(tokenKey); // Remove invalid token
    onError(error.message); // Call error callback
  });
}

// Function to reset token and redirect to login page
function logout() {
  localStorage.removeItem(tokenKey);
  window.location.href = 'login.html';
}
