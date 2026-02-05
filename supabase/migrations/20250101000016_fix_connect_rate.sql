-- Update Connect rate KPI definition and formula
UPDATE kpis
SET 
  description = 'Quantidade de pessoas que visualizaram uma página. Ele é impactado pelo tempo de carregamento.',
  formula = 'Visualizações de página / Clique no anúncio'
WHERE name = 'Connect rate';
