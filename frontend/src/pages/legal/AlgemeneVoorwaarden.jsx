import './Legal.css';

export default function AlgemeneVoorwaarden() {
  return (
    <main className="legal-page">
      <div className="container legal-container">
        <header className="legal-header">
          <p className="legal-header__label">Juridisch</p>
          <h1 className="legal-header__title">Algemene voorwaarden</h1>
          <p className="legal-header__meta">Laatst bijgewerkt: januari 2025</p>
        </header>

        <section className="legal-section">
          <h2 className="legal-section__title">1. Definities</h2>
          <ul>
            <li><strong>Platform:</strong> de website en diensten van Tandvlees Coach</li>
            <li><strong>Cursist:</strong> een natuurlijk persoon die een account aanmaakt op het platform</li>
            <li><strong>Cursus:</strong> het digitale opleidingsprogramma aangeboden via het platform</li>
            <li><strong>Overeenkomst:</strong> de koopovereenkomst die tot stand komt bij aankoop van een cursus</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2 className="legal-section__title">2. Toepasselijkheid</h2>
          <p>
            Deze algemene voorwaarden zijn van toepassing op alle aanbiedingen, overeenkomsten en diensten van Tandvlees Coach. Door gebruik te maken van het platform aanvaardt u deze voorwaarden.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section__title">3. Aanbod en aanvaarding</h2>
          <p>
            Alle aanbiedingen op het platform zijn vrijblijvend. Een overeenkomst komt tot stand op het moment dat u een betaling heeft voltooid en een bevestigingsmail heeft ontvangen.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section__title">4. Prijzen en betaling</h2>
          <p>
            Alle vermelde prijzen zijn inclusief BTW, tenzij anders aangegeven. Betaling geschiedt vooraf via de aangeboden betaalmethoden. Na succesvolle betaling krijgt u direct toegang tot de gekochte cursus.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section__title">5. Toegang tot de cursus</h2>
          <p>
            Na aankoop krijgt u een persoonlijk, niet-overdraagbaar recht op toegang tot de cursus. Het is niet toegestaan cursusmateriaal te delen, te kopiëren of te verspreiden. Tandvlees Coach behoudt zich het recht voor toegang te ontzeggen bij misbruik.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section__title">6. Herroepingsrecht</h2>
          <p>
            Als consument heeft u het recht de overeenkomst binnen 14 dagen na aankoop te herroepen, zonder opgaaf van reden. Dit herroepingsrecht vervalt echter zodra u toegang heeft gehad tot digitale inhoud, mits u vooraf uitdrukkelijk heeft ingestemd met het verlies van dit recht.
          </p>
          <p>[Pas dit aan op basis van uw specifieke situatie en juridisch advies]</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section__title">7. Aansprakelijkheid</h2>
          <p>
            Tandvlees Coach is niet aansprakelijk voor indirecte schade, gevolgschade of gederfde winst. De aansprakelijkheid is in alle gevallen beperkt tot het bedrag dat de cursist voor de betreffende cursus heeft betaald.
          </p>
          <p>
            De inhoud van de cursus is informatief van aard en vervangt geen professioneel medisch advies. Raadpleeg bij klachten altijd een tandarts of andere zorgverlener.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section__title">8. Klachten</h2>
          <p>
            Klachten over onze dienstverlening kunt u indienen via <a href="mailto:info@tandvleescoach.nl">info@tandvleescoach.nl</a>. Wij streven ernaar klachten binnen 5 werkdagen te behandelen.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section__title">9. Toepasselijk recht</h2>
          <p>
            Op deze algemene voorwaarden is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter in het arrondissement waar Tandvlees Coach is gevestigd.
          </p>
        </section>

        <div className="legal-contact">
          <p><strong>Vragen over deze voorwaarden?</strong></p>
          <p>Neem contact op via <a href="mailto:info@tandvleescoach.nl">info@tandvleescoach.nl</a></p>
        </div>
      </div>
    </main>
  );
}
