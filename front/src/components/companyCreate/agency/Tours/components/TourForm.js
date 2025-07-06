import React from 'react';
import PickupTimeForm from './form_inputs/PickupTimeForm';
import PriceInputs from './form_inputs/PriceInputs';
import OptionInput from './form_inputs/OptionInput';
import DaySelector from './form_inputs/DaySelector';
import BolgeSelector from './form_inputs/BolgeSelector';
import AutocompleteInput from './form_inputs/AutocompleteInput';

const TourForm = ({
  tourData,
  formInputs,
  savedRegions,
  savedAreas,
  onSubmit,
  onChange,
  onTimeChange,
  onAddTime,
  onRemoveTime,
  onOptionChange,
  onAddOption,
  onRemoveOption,
  onDaySelect,
  onSelectAllDays,
  bolgeler
}) => {
  return (
    <form onSubmit={onSubmit}>
      <div className="row g-3">
        {formInputs
          .filter(input => ['tourName', 'operator', 'priority'].includes(input.id))
          .sort((a, b) => {
            const order = {
              'tourName': 1,
              'operator': 2,
              'priority': 3
            };
            return order[a.id] - order[b.id];
          })
          .map((input, index) => (
            <div key={index} className={`${
              input.id === 'tourName' ? 'col-12' : 
              input.id === 'operator' ? 'col-md-6' : 
              input.id === 'priority' ? 'col-md-6' : 
              'col-md-6'
            }`}>
              <div className="form-group">
                <label className="form-label">
                  <i className={`bi ${input.icon} me-2`}></i>
                  {input.label}
                </label>
                
                {input.type === 'autocomplete' ? (
                  <AutocompleteInput
                    id={input.id}
                    value={tourData[input.id]}
                    onChange={onChange}
                    options={input.options}
                    placeholder={input.placeholder}
                    icon={input.icon}
                  />
                ) : input.type === 'select' ? (
                  <select
                    className="form-select"
                    name={input.id}
                    value={tourData[input.id]}
                    onChange={onChange}
                  >
                    <option value="">{input.placeholder}</option>
                    {input.options.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
            </div>
          ))}

        {formInputs
          .filter(input => !['tourName', 'operator', 'priority'].includes(input.id))
          .map((input, index) => (
          <div key={index} 
               className={`${input.id === 'priority' ? 'col-md-6' : 'col-md-6'}`}>
            <div className="form-group">
              <label className="form-label">
                <i className={`bi ${input.icon} me-2`}></i>
                {input.label}
              </label>
              
              {input.type === 'autocomplete' ? (
                <AutocompleteInput
                  id={input.id}
                  value={tourData[input.id]}
                  onChange={onChange}
                  options={input.options}
                  placeholder={input.placeholder}
                  icon={input.icon}
                />
              ) : input.type === 'select' ? (
                <select
                  className="form-select"
                  name={input.id}
                  value={tourData[input.id]}
                  onChange={onChange}
                >
                  <option value="">{input.placeholder}</option>
                  {input.options.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
          </div>
        ))}
        
        <BolgeSelector 
          value={tourData.bolgeId}
          onChange={onChange}
          bolgeler={bolgeler}
        />
        
       
        <PriceInputs
          value={{
            adultPrice: tourData.adultPrice,
            childPrice: tourData.childPrice,
            guideAdultPrice: tourData.guideAdultPrice,
            guideChildPrice: tourData.guideChildPrice
          }}
          onChange={onChange}
        />

        <div className="col-12">
          <div className="form-group">
            <label className="form-label">
              <i className="bi bi-currency-exchange me-2"></i>
              Para Birimi
            </label>
            <select
              className="form-select"
              name="currency"
              value={tourData.currency}
              onChange={onChange}
            >
              <option value="EUR">EUR - Euro</option>
              <option value="USD">USD - Amerikan Doları</option>
              <option value="GBP">GBP - İngiliz Sterlini</option>
              <option value="TL">TL - Türk Lirası</option>
            </select>
          </div>
        </div>

        <div className="col-12">
          <div className="form-group">
            <label className="form-label">
              <i className="bi bi-card-text me-2"></i>
              Tur Açıklaması
            </label>
            <textarea
              className="form-control"
              name="description"
              value={tourData.description || ''}
              onChange={onChange}
              rows="3"
              placeholder="Tur hakkında açıklama yazın..."
            ></textarea>
          </div>
        </div>

        <OptionInput
          label="Opsiyonlar"
          icon="bi-plus-circle"
          options={tourData.options}
          onChange={onOptionChange}
          onAdd={onAddOption}
          onRemove={onRemoveOption}
        />

        <DaySelector
          selectedDays={tourData.selectedDays}
          onDaySelect={onDaySelect}
          onSelectAll={onSelectAllDays}
        />
         <PickupTimeForm
          pickupTimes={tourData.pickupTimes}
          savedRegions={savedRegions}
          savedAreas={savedAreas}
          onTimeChange={onTimeChange}
          onAddTime={onAddTime}
          onRemoveTime={onRemoveTime}
        />

      </div>

      <div className="d-grid mt-4">
        <button 
          type="submit" 
          className={`btn ${tourData.editingIndex !== null ? 'btn-success' : 'btn-primary'}`}
          style={{ width: 'auto', margin: '0 auto' }}
        >
          <i className={`bi ${tourData.editingIndex !== null ? 'bi-check-lg' : 'bi-plus-lg'} me-2`}></i>
          {tourData.editingIndex !== null ? 'Değişiklikleri Kaydet' : 'Tur Oluştur'}
        </button>
      </div>
    </form>
  );
};

export default TourForm; 