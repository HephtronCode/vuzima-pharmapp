CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_name_unique ON suppliers(name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_drugs_brand_generic_unique ON drugs(brand_name, generic_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_drug_batch_unique ON inventory_items(drug_id, batch_number);
