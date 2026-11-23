// Contact form. With data-endpoint set, the message is sent to that server;
// without it, the visitor's own mail program opens with the message filled in.
(function () {
  'use strict';
  var y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());

  var form = document.getElementById('contact-form');
  if (!form) return;
  var status = document.getElementById('form-status');
  var button = form.querySelector('button[type="submit"]');
  var endpoint = (form.getAttribute('data-endpoint') || '').trim();
  var mailto = form.getAttribute('data-mailto') || '';

  function say(text, kind) {
    status.textContent = text;
    status.className = 'form__status' + (kind ? ' is-' + kind : '');
  }
  function mark(input, message) {
    var field = input.closest('.field');
    var old = field.querySelector('.field__err');
    if (old) old.remove();
    field.classList.toggle('is-bad', !!message);
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (message) {
      var p = document.createElement('p');
      p.className = 'field__err';
      p.textContent = message;
      field.appendChild(p);
    }
  }
  function check() {
    var name = form.elements.name, email = form.elements.email, message = form.elements.message;
    var first = null;
    function test(input, bad, text) { mark(input, bad ? text : ''); if (bad && !first) first = input; }
    test(name, name.value.trim().length < 2, 'Нэрээ бичнэ үү.');
    test(email, !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()), 'Имэйл хаягаа name@example.com хэлбэрээр бичнэ үү.');
    test(message, message.value.trim().length < 10, 'Зурвасаа арай дэлгэрэнгүй бичнэ үү (10-аас дээш тэмдэгт).');
    if (first) first.focus();
    return !first;
  }
  function openMail(data) {
    var subject = 'Вэб сайтаас: ' + data.name;
    var body = data.message + '\n\n' + data.name + '\n' + data.email;
    window.location.href = 'mailto:' + mailto + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    say('Таны имэйлийн программ нээгдлээ. Тэндээс «Илгээх» дарна уу.', 'ok');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    say('', '');
    if (form.elements.website.value) return; // filled only by bots
    if (!check()) return;
    var data = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      message: form.elements.message.value.trim()
    };
    if (!endpoint) { openMail(data); return; }

    button.disabled = true;
    say('Илгээж байна…', '');
    var ctl = new AbortController();
    var timer = setTimeout(function () { ctl.abort(); }, 15000);
    fetch(endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        name: data.name, email: data.email, message: data.message,
        _subject: 'Вэб сайтаас зурвас: ' + data.name, _template: 'table', _captcha: 'false'
      }), signal: ctl.signal
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok && j.ok !== false && String(j.success) !== 'false', error: j.error }; });
    }).then(function (res) {
      if (res.ok) { form.reset(); say('Зурвас илгээгдлээ. Удахгүй хариу бичнэ.', 'ok'); }
      else say(res.error || 'Зурвас илгээгдсэнгүй. Дахин оролдох эсвэл ' + mailto + ' хаяг руу бичнэ үү.', 'err');
    }).catch(function () {
      say('Сервертэй холбогдож чадсангүй. Интернэтээ шалгаад дахин оролдох эсвэл ' + mailto + ' хаяг руу бичнэ үү.', 'err');
    }).then(function () { clearTimeout(timer); button.disabled = false; });
  });
})();
