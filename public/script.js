const CLIENT_ID = "1090469597418-voft8usqnsbi349e37skvrsemmig7jto.apps.googleusercontent.com";
let idToken = null;

window.onload = () => {
  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: (r) => { idToken = r.credential; }
  });
  google.accounts.id.renderButton(
    document.getElementById("botao-google"),
    { theme: "outline", size: "large" }
  );
};

document.getElementById("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const erro = document.getElementById("erro");
  const resultado = document.getElementById("resultado");
  erro.textContent = "";
  resultado.innerHTML = "";

  const numero = Number(document.getElementById("numero").value);

  try {
    const resp = await fetch("/api/desenho", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + (idToken || "")
      },
      body: JSON.stringify({ numero })
    });

    if (resp.status === 400) {
      erro.textContent = "Erro 400: número inválido (use um inteiro de 1 a 100).";
      return;
    }
    if (resp.status === 401) {
      erro.textContent = "Erro 401: faça login com o Google.";
      return;
    }
    if (!resp.ok) {
      erro.textContent = "Erro " + resp.status + " ao gerar o desenho.";
      return;
    }

    const svg = await resp.text();
resultado.innerHTML = svg;
const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
const a = document.createElement("a");
a.href = url;
a.download = "exemplo.svg";
a.textContent = "Baixar SVG";
resultado.appendChild(a);
  } catch {
    erro.textContent = "Falha de rede ao chamar /api/desenho.";
  }
});
