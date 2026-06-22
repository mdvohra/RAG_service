import { api, setToken } from "../api";
import { renderAuthLayout } from "../layouts/AuthLayout";
import { navigate } from "../router";
import { el } from "../ui/helpers";
import { showToast } from "../ui/toast";

export function renderLogin() {
  const card = el("div", "card");
  card.append(el("h1", "", "Welcome back"), el("p", "sub", "Sign in to your RAG4All dashboard"));

  const email = el("input", "input") as HTMLInputElement;
  email.type = "email";
  email.placeholder = "Email";
  email.autocomplete = "email";
  const pass = el("input", "input") as HTMLInputElement;
  pass.type = "password";
  pass.placeholder = "Password";
  pass.autocomplete = "current-password";

  const fieldEmail = el("div", "field");
  fieldEmail.append(el("label", "", "Email"), email);
  const fieldPass = el("div", "field");
  fieldPass.append(el("label", "", "Password"), pass);

  const btn = el("button", "btn btn-primary", "Sign in");
  btn.onclick = async () => {
    try {
      const d = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.value, password: pass.value }),
      }) as { access_token: string; onboarding_complete: boolean };
      setToken(d.access_token);
      showToast("Signed in");
      navigate(d.onboarding_complete ? "/app" : "/app/setup", true);
    } catch (e) {
      showToast((e as Error).message, "error");
    }
  };

  const linkRow = el("div", "link-row");
  const link = el("a", "", "Create an account");
  link.href = "/signup";
  link.onclick = (e) => { e.preventDefault(); navigate("/signup"); };
  linkRow.append("New to RAG4All? ", link);

  card.append(fieldEmail, fieldPass, btn, linkRow);
  return renderAuthLayout(card, "/assets/illustrations/step-complete.svg", "Your knowledge, everywhere", "Manage documents, test AI, and embed chat on your site.");
}
