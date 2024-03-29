const forms = document.getElementById("forms").children;

// if key is pressed on site
document.addEventListener("keydown", async ({ key }) => {
  if (document.activeElement.nodeName === "BODY") {

    // if it is first entry, focus first box
    if (!forms[0].children[2].children[0].value) {
      forms[0].children[2].children[0].focus();
    } else {

      // backspace across multiple element boxes
      const currentPosition = getRecentElement();
      if (key === "Backspace") {
        if (!(currentPosition.previousElementSibling && currentPosition.value.length && currentPosition.disabled))  {
          const previousForm = currentPosition.parentElement.parentElement.previousElementSibling;
          if (previousForm) {
            const newCurrentPosition = previousForm.children[2].children[previousForm.children[2].children.length - 1];
              
            // only delete if element is editable
            if (!newCurrentPosition.disabled) {
              newCurrentPosition.value = "";
              return newCurrentPosition.focus();
            }
          } else {
            const newCurrentPosition = currentPosition.previousElementSibling;
              
            // only delete if element is editable
            if (!newCurrentPosition.disabled) {
              newCurrentPosition.value = "";
              return newCurrentPosition.focus();
            }
          }
        } else {
          currentPosition.value = "";
          return currentPosition.focus();
        }
          
        currentPosition.previousElementSibling.value = "";
        return currentPosition.previousElementSibling.focus();
      }

      if (currentPosition){
        if (currentPosition.value) {
          const previousParent = currentPosition.parentElement.previousElementSibling;
          if (previousParent) {
            await sleep(1);
            return previousParent.children[previousParent.length - 1].focus();
          } else {
            await sleep(1);
            return currentPosition.previousElementSibling.focus();
          }
        }

        currentPosition.focus();
      }
    }
  }
});

function getRecentElement() {
  for (const form of forms) {
    for (const input of form.children[2].children) {
      if (input.hidden) continue;
      if (!input.value) return input;
    }
  }
}

for (const form of forms) {
  form.addEventListener("input", ({ data, target }) => {
    if (!data) return;
    
    const next = target.nextElementSibling;
    if (next && next.nodeName === "INPUT") next.focus();
  });

  form.addEventListener("keydown", async ({ key, target }) => {
    if (key == "Backspace" && target.previousElementSibling) {
      const previous = target.previousElementSibling;

      if (previous.nodeName === "INPUT") {
        await sleep(1);
        return previous.focus();
      }
        
      const previousParent = target.parentElement.previousElementSibling;
      if (previous.hidden && previousParent) {
        return previousParent.children[previousParent.length - 1].focus();
      }
    } else if (key == "Enter") {
      const next = target.nextElementSibling;
      const nextParent = target.parentElement.parentElement.nextElementSibling;
      
      if (!next) submitGuess(form, nextParent);
    
    } else {
      if (target.value && target.previousElementSibling) {
        const next = target.nextElementSibling;
        await sleep(1);

        if (next) next.focus();
      }
    }
  });
}

const hintForm = document.getElementById("submitHint");

function submitHint(e, code) {  
  if (e) e.preventDefault();
  if (!code) code = hintForm.children[1].value

  const data = {
    csrfmiddlewaretoken: getCookie("csrftoken"),
    code
  }

  $.ajax({
    url: "/hint/",
    method: "POST",
    data,
    success: async (response) => {
      const hint = document.getElementById("messageText");
      hint.innerText = response.message;

      if (response.success) {
        for (const hintObject of response.data) {
          const keyboardElement = document.getElementById(hintObject.letter.toLowerCase());
          
          if (keyboardElement && !keyboardElement.classList.length) {
            keyboardElement.classList.add(hintObject.result);
          } else {
            const currentClass = keyboardElement.classList[0];
        
            if (currentClass === "correct" && hintObject.result === "perfect") {
              keyboardElement.classList.remove(currentClass);
              keyboardElement.classList.add(hintObject.result);
            } 
        
            if (currentClass === "wrong" && hintObject.result === "correct") {
              keyboardElement.classList.remove(currentClass);
              keyboardElement.classList.add(hintObject.result);
            }
          }

        }

        hintForm.children[1].value = "";
        return closeModal();
      } else {
        hint.classList.add("error");
      }
    },
    error: console.log
  });

  return false;
}

let html5QrcodeScanner;

async function scanQr() {
  const modalElement = document.getElementById("myForm");
  const hintDiv = document.getElementById("hintDiv");
  const hintText = document.getElementById("hintText");
  const messageText = document.getElementById("messageText")
  if (modalElement.contains(hintDiv)) {
    modalElement.removeChild(hintDiv);
  }

  if (modalElement.contains(hintText)) {
    modalElement.removeChild(hintText);
  }

  if (modalElement.contains(messageText)) {
    modalElement.removeChild(messageText);
  }

  const divElement = document.createElement("div");
  divElement.setAttribute("id", "qrDiv");
  modalElement.insertBefore(divElement, hintForm);
  
  html5QrcodeScanner = new Html5QrcodeScanner("qrDiv", { 
    fps: 10, 
    qrbox: {
      width: 250, 
      height: 250
    } 
  }, false);

  html5QrcodeScanner.render((code) => {
    modalElement.insertBefore(hintDiv, hintForm);
    modalElement.insertBefore(hintText, hintForm);
    modalElement.insertBefore(messageText, hintForm);

    submitHint(null, code);
    html5QrcodeScanner.clear();
  });

}

async function hintButton() {
  const modalElement = document.getElementById("myForm");
  if (modalElement.style.display === "block") return closeModal();

  if (modalElement.contains(document.getElementById("hintDiv"))) {
    modalElement.removeChild(document.getElementById("hintDiv"));
  }

  if (modalElement.contains(document.getElementById("hintText"))) {
    modalElement.removeChild(document.getElementById("hintText"));
  }

  if (modalElement.contains(document.getElementById("messageText"))) {
    modalElement.removeChild(document.getElementById("messageText"));
  }


  const divElement = document.createElement("div");
  divElement.setAttribute("id", "hintDiv");
  modalElement.insertBefore(divElement, hintForm);

  const codeElement = document.createElement("h1");
  const codeTextNode = document.createTextNode("");

  codeElement.setAttribute("id", "hintText");
  codeElement.classList.add("title");
  codeElement.appendChild(codeTextNode);
  modalElement.insertBefore(codeElement, hintForm);

  const messageElement = document.createElement("h4");
  const messageTextNode = document.createTextNode("");

  messageElement.setAttribute("id", "messageText");
  messageElement.appendChild(messageTextNode);
  messageElement.classList.add("title");
  modalElement.insertBefore(messageElement, hintForm);

  modalElement.style.display = "block";    


  while (modalElement.style.display === "block" && modalElement.contains(document.getElementById("hintDiv"))) {
    const data = {
      csrfmiddlewaretoken: getCookie("csrftoken")
    }

    $.ajax({
      url: "/qr/",
      method: "POST",
      data,
      success: async ({ svg, code }) => {
        const hintText = document.getElementById("hintText");

        divElement.innerHTML = svg.replace(/58mm/g, "100%");
        hintText.innerText = "CODE: " + code
      },
      error: console.log
    });

    await sleep(10000);
  }
}

const closeElement = document.getElementById("close");
closeElement.addEventListener("click", () => {
  closeModal();
});

function closeModal(modalElement) {
  if (!modalElement) {
    modalElement = document.getElementById("myForm");
    for (const child of modalElement.children) {
      if (child.nodeName === "FORM") continue;
      modalElement.removeChild(child);
    }

    if (html5QrcodeScanner) html5QrcodeScanner.clear();
  }

  modalElement.style.display = "none";
}

const modalElement = document.getElementById("myForm");
window.onclick = event => {
  const backgroundElement = document.getElementsByClassName("parent")[0];
  if (event.target == backgroundElement) {
    closeModal();
  }
}

const keyboard = document.getElementsByClassName("keyboard")[0];
if (keyboard) {
  for (const row of keyboard.children) {
    for (const input of row.children) {
      input.addEventListener("click", () => {
        const currentPosition = getRecentElement();

        if (input.id.length > 1) {
          if (input.id === "backspace") {
            if (!(currentPosition.previousElementSibling && currentPosition.value.length && currentPosition.disabled))  {
              const previousForm = currentPosition.parentElement.parentElement.previousElementSibling;
              if (previousForm) {
                const newCurrentPosition = previousForm.children[2].children[previousForm.children[2].children.length - 1];
                  
                // only delete if element is editable
                if (!newCurrentPosition.disabled) {
                  newCurrentPosition.value = "";
                  return newCurrentPosition.focus();
                }
              } else {
                const newCurrentPosition = currentPosition.previousElementSibling;
                  
                // only delete if element is editable
                if (!newCurrentPosition.disabled) {
                  newCurrentPosition.value = "";
                  return newCurrentPosition.focus();
                }
              }
            } else {
              currentPosition.value = "";
              return currentPosition.focus();
            }
              
            currentPosition.previousElementSibling.value = "";
            return currentPosition.previousElementSibling.focus();
          }

          if (input.id === "enter") {
            if (currentPosition) {
              const nextParent = currentPosition.parentElement.parentElement;
              const form = currentPosition.parentElement.parentElement.previousElementSibling;
              submitGuess(form, nextParent);
            } else {
              const form = forms[forms.length - 1];
              submitGuess(form, null);
            }

          }
        } else {
          if (currentPosition.disabled) return;
          currentPosition.value = input.id;
        }
      });
    }
  }
} else {
  for (const form of forms) {
    for (const input of form) {
      input.disabled = true;
    }
  }
}

async function submitGuess(form, nextParent) {
  const data = Object.fromEntries(new FormData(form)); 
  const wordArray = Object.values(data).filter(c => c != " ");

  wordArray.splice(-2);
  if (!wordArray.length) return;

  const word = wordArray.reduce((a, b) => a + b);
  if (word.length !== form.children[2].children.length) return;

  $.ajax({
    type: "POST",
    url: "/check/",
    data,
    success: async responseJSON => {
      if (!responseJSON.valid) {
        for (const input of form) {
          input.classList.add("result");
  
          sleep(200).then(() => {
            input.classList.remove("result");
          });
        }

        return;
      }

      const won = responseJSON.success;

      delete responseJSON.success;
      delete responseJSON.valid;

      for (const input of form) {
        input.disabled = true;
      }

      for (const [position, value] of Object.entries(responseJSON)) {
        const idx = Number(position) - 1;
        const inputElement = form.children[2].children[idx];

        inputElement.classList.add("result");
        await sleep(300);
        inputElement.classList.add(value);
        await sleep(200);
        inputElement.classList.remove("result");

        const keyboardElement = document.getElementById(inputElement.value);     

        if (keyboardElement && !keyboardElement.classList.length) {
          keyboardElement.classList.add(value);
        } else {
          const currentClass = keyboardElement.classList[0];

          if (currentClass === "correct" && value === "perfect") {
            keyboardElement.classList.remove(currentClass);
            keyboardElement.classList.add(value);
          } 

          if (currentClass === "wrong" && value === "correct") {
            keyboardElement.classList.remove(currentClass);
            keyboardElement.classList.add(value);
          }
        }
      }

      if (won) {
        document.body.removeChild(keyboard);
        const hintButton = document.getElementById("hint");
        hintButton.innerText = "CHECK IN";
        return hintButton.onclick = checkIn
      }
        
      if (nextParent) {
        for (const input of nextParent) {
          input.disabled = false;
        }

        nextParent.children[2].children[0].focus();
      }
    },
    error: console.log
  });
}

function checkIn() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(({ coords: { latitude, longitude } }) => {
      const data = {
        latitude,
        longitude,
        csrfmiddlewaretoken: getCookie("csrftoken")
      }

      $.ajax({
        type: "POST",
        url: "/check_in/",
        data,
        success: async ({ success, message }) => {
          const hintDiv = document.getElementsByClassName("hint")[0];
          const messageElement = document.getElementById("checkInText");
          hintDiv.classList.add("middle");

          messageElement.textContent = message;
          if (success) {
            hintDiv.removeChild(document.getElementById("hint"));

            $.ajax({
              type: "GET",
              url: "/get_points/",
              success: async ({ points, wins }) => {
                const winsElement = document.getElementById("wins");
                const pointsElement = document.getElementById("points");

                winsElement.innerText = "Wins: " + wins;
                pointsElement.innerText = "Points: " + points;
              }
            })
          }
        },
        error: console.log
      });
    }, (err) => {
      console.log(err);
      alert("Please enable GPS");
    }, {
      maximumAge: 0, 
      timeout: 5000, 
      enableHighAccuracy: true
    });
  } else {
    alert("Please enable GPS");
  }
}

if (keyboard) {
  for (const cssKey of cssKeyboard) {
    const keyboardElement = document.getElementById(cssKey.letter.toLowerCase());
    if (keyboardElement && !keyboardElement.classList.length) {
      keyboardElement.classList.add(cssKey.result);
    } else {
      const currentClass = keyboardElement.classList[0];

      if (currentClass === "correct" && cssKey.result === "perfect") {
        keyboardElement.classList.remove(currentClass);
        keyboardElement.classList.add(cssKey.result);
      } 

      if (currentClass === "wrong" && cssKey.result === "correct") {
        keyboardElement.classList.remove(currentClass);
        keyboardElement.classList.add(cssKey.result);
      }
    }
  }
}

async function sleep(timeout=2000) {
  return new Promise(res => {
    setTimeout(res, timeout);
  })
}

function getCookie(name) {
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
      const cookie = jQuery.trim(cookies[i]);
      if (cookie.substring(0, name.length + 1) === (name + "=")) {
        return decodeURIComponent(cookie.substring(name.length + 1));
      }
    }
  }
}