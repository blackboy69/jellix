function displayErrorMessage(message) {
  const errorDiv = document.getElementById('error');
  errorDiv.textContent = message;
}

if (accessToken) {
  verifyToken(accessToken, () => {
    // On success - redirect to index.html
    window.location.href = 'index.html';
  },
  errorMessage => {
    // On error - display error message
    displayErrorMessage(errorMessage);
  });
} else {
  const loginForm = document.getElementById('login-form');
  loginForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const login_method = loginForm.login_method.value;
    const username = loginForm.username.value;
    const password = loginForm.password.value;
    const quickcode_secret = loginForm.quickcode_secret.value;
    authenticate(login_method, username, password, quickcode_secret);
  });
}

function authenticate(login_method, username, password, quickcode_secret) {
  var endpoint = '';
  var formbody = '';
  if (login_method === 'username') {
    endpoint = 'AuthenticateByName';
    formbody = JSON.stringify({
      Username: username,
      Pw: password
    });
  } else if (login_method === 'quickcode') {
    endpoint = 'AuthenticateWithQuickConnect';
    formbody = JSON.stringify({
      Secret: quickcode_secret
    });
  }
  fetch(`${API_URL}Users/` + endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `MediaBrowser Client="${client}", Device="${device}", DeviceId="${device_id}", Version="${client_version}"`,
    },
    body: formbody
  })
  .then(response => {
    if (response.ok) {
      return response.json();
    }
    throw new Error('Authentication failed');
  })
  .then(data => {
    const accessToken = data.AccessToken;
    if (accessToken) {
      localStorage.setItem(tokenKey, accessToken);
      window.location.href = 'index.html';
    } else {
      throw new Error('Access token not found');
    }
  })
  .catch(error => {
    displayErrorMessage(error.message);
  });
}

function initializeQuickConnect() {
  fetch(`${API_URL}QuickConnect/Initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `MediaBrowser Client="${client}", Device="${device}", DeviceId="${device_id}", Version="${client_version}"`,
    },
    body: ''
  })
  .then(response => {
    if (response.ok) {
      return response.json();
    }
    throw new Error('Could not get QuickConnect code');
  })
  .then(data => {
    const quickcode = data.Code;
    const secret = data.Secret;
    document.getElementById('quickcode').value = quickcode;
    document.getElementById('quickcode_secret').value = secret;
  })
  .catch(error => {
    displayErrorMessage(error.message);
  });
}

function changeAuthenticationMethod(login_method) {
  if (login_method === 'username') {
    document.getElementById('auth-by-quickcode').style.display = 'none';
    document.getElementById('username').required = true;
    document.getElementById('password').required = true;
    document.getElementById('auth-by-credentials').style.display = 'block';
  } else if (login_method === 'quickcode') {
    const quickconnect_active = parseInt(document.getElementById('quickcode_status').value);
    if (!quickconnect_active)
      initializeQuickConnect();
    document.getElementById('quickcode_status').value = 1;
    document.getElementById('auth-by-credentials').style.display = 'none';
    document.getElementById('username').required = false;
    document.getElementById('password').required = false;
    document.getElementById('auth-by-quickcode').style.display = 'block';
  }
}
