import React from 'react';

export default function AuthForm({
  title,
  fields,
  onSubmit,
  submitLabel,
  loading,
  alternateAction,
  helper,
  children,
}) {
  return (
    <form className="stacked-form" onSubmit={onSubmit}>
      <div className="card-heading">
        <h2>{title}</h2>
        {helper ? <p>{helper}</p> : null}
      </div>
      {fields.map((field) => (
        <label className="field" key={field.name}>
          <span>{field.label}</span>
          <input {...field.inputProps} />
        </label>
      ))}
      {children}
      <button type="submit" className="primary-button" disabled={loading}>
        {loading ? 'Working...' : submitLabel}
      </button>
      {alternateAction}
    </form>
  );
}
