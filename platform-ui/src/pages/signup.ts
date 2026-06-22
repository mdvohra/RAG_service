import { api, setToken } from "../api";
import { renderAuthLayout } from "../layouts/AuthLayout";
import { navigate } from "../router";
import { el, normalizeUrl } from "../ui/helpers";
import { showToast } from "../ui/toast";

export function renderSignup() {
  const card = el("div", "card");
  card.append(el("h1", "", "Create your account"), el("p", "sub", "Start free — upload docs and embed in minutes"));

  const org = el("input", "input") as HTMLInputElement;
  org.placeholder = "Organization name";
  const email = el("input", "input") as HTMLInputElement;
  email.type = "email";
  email.placeholder = "Email";
  const pass = el("input", "input") as HTMLInputElement;
  pass.type = "password";
  pass.placeholder = "Password (min 8 characters)";
  const site = el("input", "input") as HTMLInputElement;
  site.placeholder = "https://www.yourcompany.com (optional)";

  const fields = [
    { label: "Organization", input: org },
    { label: "Email", input: email },
    { label: "Password", input: pass },
    { label: "Website (optional)", input: site },
  ];
  fields.forEach((f) => {
    const wrap = el("div", "field");
    wrap.append(el("label", "", f.label), f.input);
    card.appendChild(wrap);
  });

  const hint = el("p", "help-text", "Password must be at least 8 characters.");

  const btn = el("button", "btn btn-primary", "Create account");
  btn.onclick = async () => {
    if (pass.value.length < 8) {
      showToast("Password must be at least 8 characters", "error");
      return;
    }
    try {
      const siteUrl = site.value.trim() ? normalizeUrl(site.value) : null;
      const d = await api("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          org_name: org.value.trim(),
          email: email.value.trim(),
          password: pass.value,
          site_url: siteUrl,
        }),
      }) as { access_token: string };
      setToken(d.access_token);
      showToast("Account created");
      navigate("/app/setup", true);
    } catch (e) {
      showToast((e as Error).message, "error");
    }
  };

  const linkRow = el("div", "link-row");
  const link = el("a", "", "Sign in");
  link.href = "/login";
  link.onclick = (e) => { e.preventDefault(); navigate("/login"); };
  linkRow.append("Already have an account? ", link);

  card.append(hint, btn, linkRow);
  return renderAuthLayout(card);
}
