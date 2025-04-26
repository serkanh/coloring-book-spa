import React from 'react';

export type PaperType = 'thin_matte' | 'thick_sheen';

interface PaperTypeSelectorProps {
  selectedPaperType: PaperType;
  onPaperTypeChange: (type: PaperType) => void;
  disabled?: boolean;
}

const PaperTypeSelector: React.FC<PaperTypeSelectorProps> = ({
  selectedPaperType,
  onPaperTypeChange,
  disabled = false,
}) => {
  if (disabled) {
    return null; // Don't render if disabled (for digital orders)
  }

  return (
    <div className="my-8">
      <h2 className="text-2xl font-bold mb-4">Choose Your Paper Type</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Thinner Matte Paper Option */}
        <div
          className={`border-2 rounded-lg p-6 cursor-pointer transition-all transform hover:shadow-lg
            ${selectedPaperType === 'thin_matte'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300'
            }`}
          onClick={() => !disabled && onPaperTypeChange('thin_matte')}
        >
          <div className="flex items-center mb-3">
            <input
              type="radio"
              checked={selectedPaperType === 'thin_matte'}
              onChange={() => onPaperTypeChange('thin_matte')}
              disabled={disabled}
              className="h-5 w-5 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-xl font-medium">Thinner Matte Paper</span>
          </div>

          <div className="ml-7">
            <p className="text-gray-600 mb-3">
              Smooth, lightweight paper that's easy to color on with pencils or fine markers.
            </p>

            <ul className="space-y-2">
              <li className="flex items-center">
                <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>80lb / 120gsm weight</span>
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Smooth, matte finish</span>
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Great for colored pencils</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Thicker Sheen Paper Option */}
        <div
          className={`border-2 rounded-lg p-6 cursor-pointer transition-all transform hover:shadow-lg
            ${selectedPaperType === 'thick_sheen'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300'
            }`}
          onClick={() => !disabled && onPaperTypeChange('thick_sheen')}
        >
          <div className="flex items-center mb-3">
            <input
              type="radio"
              checked={selectedPaperType === 'thick_sheen'}
              onChange={() => onPaperTypeChange('thick_sheen')}
              disabled={disabled}
              className="h-5 w-5 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-xl font-medium">Thicker Paper with Slight Sheen</span>
          </div>

          <div className="ml-7">
            <p className="text-gray-600 mb-3">
              Premium heavyweight paper with a slight sheen that makes colors pop.
            </p>

            <ul className="space-y-2">
              <li className="flex items-center">
                <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>100lb / 148gsm weight</span>
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Slight sheen for vibrant colors</span>
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Perfect for markers & gel pens</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaperTypeSelector;
