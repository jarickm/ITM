import React, { useState } from 'react';
import { Plus, Check, X, Database } from 'lucide-react';
import { useITM } from '../context/ITMContext';
import { DropdownOptionsConfig } from '../types/itm';

interface CategoryDropdownFieldProps {
  label: string;
  categoryKey: keyof DropdownOptionsConfig;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
  selectClassName?: string;
}

export const CategoryDropdownField: React.FC<CategoryDropdownFieldProps> = ({
  label,
  categoryKey,
  value,
  onChange,
  required = false,
  placeholder = '-- Select --',
  className = '',
  selectClassName = '',
}) => {
  const { dropdownOptions, addDropdownOption } = useITM();
  const [isAdding, setIsAdding] = useState(false);
  const [newOptionValue, setNewOptionValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const options = dropdownOptions[categoryKey] || [];
  // Include current value if it's not currently in the options array
  const hasCurrentValue = !value || options.includes(value);

  const handleQuickAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newOptionValue.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      await addDropdownOption(categoryKey, trimmed);
      onChange(trimmed);
      setNewOptionValue('');
      setIsAdding(false);
    } catch (err) {
      console.error('Failed to add dropdown option:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__ADD_NEW__') {
      setIsAdding(true);
    } else {
      onChange(val);
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1">
          <span>{label}</span>
          {required && <span className="text-rose-600">*</span>}
        </label>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-0.5 hover:underline"
            title={`Add new value to ${label} database list`}
          >
            <Plus className="w-3 h-3" />
            <span>Add to list</span>
          </button>
        )}
      </div>

      {isAdding ? (
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-indigo-50 border border-indigo-200 animate-fadeIn">
          <Database className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1.5" />
          <input
            type="text"
            autoFocus
            value={newOptionValue}
            onChange={(e) => setNewOptionValue(e.target.value)}
            placeholder={`New ${label.toLowerCase()} label...`}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleQuickAdd();
              } else if (e.key === 'Escape') {
                setIsAdding(false);
              }
            }}
            className="flex-1 bg-white border border-indigo-300 rounded px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={() => handleQuickAdd()}
            disabled={isSubmitting || !newOptionValue.trim()}
            className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-50 transition-colors"
          >
            <Check className="w-3 h-3" />
            <span>Save</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false);
              setNewOptionValue('');
            }}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <select
          value={value}
          onChange={handleSelectChange}
          required={required}
          className={`w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors ${selectClassName}`}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {!hasCurrentValue && (
            <option value={value}>
              {value} (Custom)
            </option>
          )}
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
          <option value="__ADD_NEW__" className="text-indigo-600 font-semibold bg-indigo-50">
            ➕ Add new {label.toLowerCase()} to database...
          </option>
        </select>
      )}
    </div>
  );
};
