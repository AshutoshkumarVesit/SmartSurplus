"""One-day-ahead features for the measured kitchen + serving waste target."""
import numpy as np
import pandas as pd

FEATURES = ['MENU', 'day_of_week', 'month', 'day_of_year', 'ksw_lag1',
            'ksw_lag5', 'ksw_lag10', 'ksw_lag20', 'ksw_mean5', 'ksw_std5',
            'ksw_mean20', 'ksw_std20', 'diners_previous', 'diners_mean20']


def forecast_frame(service_date, menu_code, history):
    """Append an outcome-free forecast row; every lag uses earlier dates only."""
    records = [{'DATE': str(r['service_date']), 'KSW kg': r['ksw_kg'],
                'DINERS': r.get('diners')} for r in history]
    records.append({'DATE': str(service_date), 'KSW kg': None, 'DINERS': None})
    d = pd.DataFrame(records)
    d['DATE'] = pd.to_datetime(d.DATE)
    d = d.sort_values('DATE').reset_index(drop=True)
    # Nullable observation columns become floating point, never zero-filled.
    d['KSW kg'] = pd.to_numeric(d['KSW kg'], errors='raise').astype(float)
    d['DINERS'] = pd.to_numeric(d.DINERS, errors='raise').astype(float)
    row = {'MENU': str(menu_code), 'day_of_week': d.DATE.iloc[-1].dayofweek,
           'month': d.DATE.iloc[-1].month, 'day_of_year': d.DATE.iloc[-1].dayofyear}
    for lag in [1, 5, 10, 20]: row[f'ksw_lag{lag}'] = d['KSW kg'].shift(lag).iloc[-1]
    for n in [5, 20]:
        series = d['KSW kg'].shift(1).rolling(n, min_periods=max(3, n // 2))
        row[f'ksw_mean{n}'] = series.mean().iloc[-1]
        row[f'ksw_std{n}'] = series.std().iloc[-1]
    row['diners_previous'] = d.DINERS.shift(1).iloc[-1]
    row['diners_mean20'] = d.DINERS.shift(1).rolling(20).mean().iloc[-1]
    return pd.DataFrame([row], columns=FEATURES).replace([np.inf, -np.inf], np.nan)
