import { Sigil } from './Sigil';

export function SiteFooter() {
  return (
    <footer className="colophon">
      <p className="colophon-brand">
        <Sigil />
        <span>Made with a little magic &amp; a lot of math</span>
      </p>
      <p>Not a prediction. A prompt.</p>
      <p>
        <a href="https://www.nikibirkner.com">nikibirkner.com</a>
        <span aria-hidden="true"> / </span>
        <span>tarot-ai</span>
      </p>
    </footer>
  );
}
