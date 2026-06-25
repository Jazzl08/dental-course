import './Legal.css';

export default function CookiePolicy() {
  return (
    <main className="legal-page">
      <div className="container legal-container">
        <header className="legal-header">
          <p className="legal-header__label">Juridisch</p>
          <h1 className="legal-header__title">Cookiebeleid</h1>
          <p className="legal-header__meta">Laatst bijgewerkt: januari 2025</p>
        </header>

        <section className="legal-section">
          <h2 className="legal-section__title">Wat zijn cookies</h2>
          <p>
            Cookies zijn kleine tekstbestanden die op uw apparaat worden opgeslagen wanneer u onze website bezoekt. Zij stellen ons in staat uw browser te herkennen bij een volgend bezoek en bepaalde instellingen en voorkeuren te onthouden.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section__title">Welke cookies gebruiken wij</h2>
          <p>Wij maken gebruik van de volgende categorieën cookies:</p>
          <ul>
            <li>
              <strong>Noodzakelijke cookies</strong> — vereist voor de werking van het platform, zoals het bijhouden van uw inlogsessie. Deze kunnen niet worden uitgeschakeld.
            </li>
            <li>
              <strong>Functionele cookies</strong> — onthouden uw voorkeuren, zoals taalinstellingen en cursusvoortgang.
            </li>
            <li>
              <strong>Analytische cookies</strong> — helpen ons begrijpen hoe bezoekers het platform gebruiken, zodat wij het kunnen verbeteren. Wij gebruiken hiervoor [vul in: bijv. Google Analytics of een privacy-vriendelijk alternatief].
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2 className="legal-section__title">Hoe lang blijven cookies actief</h2>
          <p>
            Sessiecookies worden verwijderd zodra u uw browser sluit. Permanente cookies blijven op uw apparaat staan totdat zij verlopen of u ze handmatig verwijdert. De bewaartermijn varieert per cookie en staat vermeld in onze cookielijst.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section__title">Hoe kunt u cookies beheren</h2>
          <p>
            U kunt cookies beheren via de instellingen van uw browser. U kunt cookies blokkeren of verwijderen, maar houd er rekening mee dat dit de werking van ons platform kan beïnvloeden.
          </p>
          <ul>
            <li>Chrome: Instellingen → Privacy en beveiliging → Cookies</li>
            <li>Firefox: Instellingen → Privacy en beveiliging → Cookies en sitegegevens</li>
            <li>Safari: Voorkeuren → Privacy → Cookies beheren</li>
            <li>Edge: Instellingen → Privacy, zoekopdrachten en services → Cookies</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2 className="legal-section__title">Wijzigingen in dit cookiebeleid</h2>
          <p>
            Wij behouden ons het recht voor dit cookiebeleid te wijzigen. Wij adviseren u dit beleid regelmatig te raadplegen. De datum bovenaan dit document geeft aan wanneer het voor het laatst is bijgewerkt.
          </p>
        </section>

        <div className="legal-contact">
          <p><strong>Vragen over cookies?</strong></p>
          <p>Neem contact op via <a href="mailto:info@tandvleescoach.nl">info@tandvleescoach.nl</a></p>
        </div>
      </div>
    </main>
  );
}
