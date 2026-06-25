import { useState, useEffect } from 'react';
import './ConsentBar.css';

export default function ConsentBar() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) setVisible(true);
    }, []);

    function accept() {
        localStorage.setItem('cookie_consent', 'accepted');
        setVisible(false);
    }

    function decline() {
        localStorage.setItem('cookie_consent', 'declined');
        setVisible(false);
    }

    if (!visible) return null;

    return (
        <div className="consent-bar" role="dialog" aria-label="Privacymelding">
            <div className="consent-bar__inner">
                <div className="consent-bar__text">
                    <p className="consent-bar__title">Cookies &amp; privacy</p>
                    <p className="consent-bar__desc">
                        Wij gebruiken cookies om uw ervaring te verbeteren en het gebruik van onze site te analyseren.
                        Lees meer in ons{' '}
                        <a href="/cookie-policy" className="consent-bar__link">cookiebeleid</a>.
                    </p>
                </div>
                <div className="consent-bar__actions">
                    <button className="consent-bar__btn consent-bar__btn--decline" onClick={decline}>
                        Weigeren
                    </button>
                    <button className="consent-bar__btn consent-bar__btn--accept" onClick={accept}>
                        Accepteren
                    </button>
                </div>
            </div>
        </div>
    );
}
