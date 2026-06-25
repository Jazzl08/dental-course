import './Legal.css';

export default function Privacy() {
  return (
    <main className="legal-page">
      <div className="container legal-container">
        <header className="legal-header">
          <p className="legal-header__label">Juridisch</p>
          <h1 className="legal-header__title">Privacybeleid</h1>
          <p className="legal-header__meta">Laatst bijgewerkt: januari 2025</p>
        </header>

        <section className="legal-section">
          <h2 className="legal-section__title">Wie zijn wij</h2>
          <p>
            Tandvlees Coach is een online cursusplatform gericht op mondgezondheid. Wij zijn verantwoordelijk voor de verwerking van uw persoonsgegevens zoals beschreven in dit privacybeleid.
          </p>
          <p>[Vul hier uw bedrijfsnaam, KVK-nummer en adres in]</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section__title">Welke gegevens verzamelen wij</h2>
          <p>Wij verzamelen de volgende persoonsgegevens wanneer u gebruik maakt van ons platform:</p>
          <ul>
            <li>Voor- en achternaam</li>
            <li>E-mailadres</li>
            <li>Betalingsgegevens (verwerkt via onze betaalprovider)</li>
            <li>Voortgangsgegevens binnen de cursus</li>
            <li>Technische gegevens zoals IP-adres en browsertype (via cookies)</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2 className="legal-section__title">Waarom verzamelen wij uw gegevens</h2>
          <p>Wij verwerken uw persoonsgegevens voor de volgende doeleinden:</p>
          <ul>
            <li>Het aanmaken en beheren van uw account</li>
            <li>Het verlenen van toegang tot de cursusinhoud</li>
            <li>Het verwerken van betalingen</li>
            <li>Het verbeteren van ons platform</li>
            <li>Het voldoen aan wettelijke verplichtingen</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2 className="legal-section__title">Hoe lang bewaren wij uw gegevens</h2>
          <p>
            Wij bewaren uw persoonsgegevens niet langer dan noodzakelijk voor de doeleinden waarvoor zij zijn verzameld. Accountgegevens worden bewaard zolang uw account actief is. Na verwijdering van uw account worden uw gegevens binnen 30 dagen gewist, tenzij wettelijke verplichtingen een langere bewaartermijn vereisen.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section__title">Uw rechten</h2>
          <p>Op grond van de AVG heeft u de volgende rechten:</p>
          <ul>
            <li>Recht op inzage van uw persoonsgegevens</li>
            <li>Recht op rectificatie van onjuiste gegevens</li>
            <li>Recht op verwijdering van uw gegevens</li>
            <li>Recht op beperking van de verwerking</li>
            <li>Recht op dataportabiliteit</li>
            <li>Recht om bezwaar te maken tegen de verwerking</li>
          </ul>
          <p>U kunt uw rechten uitoefenen door contact met ons op te nemen via onderstaande gegevens.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section__title">Delen met derden</h2>
          <p>
            Wij verkopen uw persoonsgegevens niet aan derden. Wij kunnen uw gegevens delen met verwerkers die namens ons diensten uitvoeren, zoals een betaalprovider en e-mailservice. Met deze partijen sluiten wij verwerkersovereenkomsten af.
          </p>
        </section>

        <div className="legal-contact">
          <p><strong>Vragen of verzoeken?</strong></p>
          <p>Neem contact op via <a href="mailto:info@tandvleescoach.nl">info@tandvleescoach.nl</a></p>
          <p>U heeft ook het recht een klacht in te dienen bij de Autoriteit Persoonsgegevens via <a href="https://autoriteitpersoonsgegevens.nl" target="_blank" rel="noreferrer">autoriteitpersoonsgegevens.nl</a>.</p>
        </div>
      </div>
    </main>
  );
}
