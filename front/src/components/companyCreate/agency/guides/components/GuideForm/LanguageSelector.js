import React from 'react';

const LanguageSelector = ({ formData, onChange, onLanguageChange }) => {
  const defaultLanguages = {
    almanca: false,
    rusca: false,
    ingilizce: false,
    fransizca: false,
    arapca: false,
  };

  return (
    <div className="col-12">
      <div className="form-group">
        <label className="form-label">Bildiği Diller</label>
        <div className="border rounded p-3">
          <div className="d-flex flex-wrap gap-3">
            {Object.keys(defaultLanguages).map((lang) => (
              <div className="form-check" key={lang}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  name={lang}
                  checked={formData.languages[lang]}
                  onChange={onLanguageChange}
                  id={`lang-${lang}`}
                />
                <label className="form-check-label" htmlFor={`lang-${lang}`}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </label>
              </div>
            ))}
          </div>
          <input
            type="text"
            className="form-control mt-3"
            name="otherLanguages"
            value={formData.otherLanguages}
            onChange={onChange}
            placeholder="Diğer diller (virgülle ayırarak yazınız)"
          />
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector; 