function parseCsvLine(line) {
  const cells = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      cells.push(current)
      current = ''
      continue
    }

    current += char
  }

  cells.push(current)
  return cells.map((cell) => cell.trim())
}

export function parseInventoryCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    throw new Error('CSV must include a header row and at least one data row')
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase())
  const requiredHeaders = ['drug_id', 'expiry_date', 'quantity_on_hand']

  const missing = requiredHeaders.filter((header) => !headers.includes(header))
  if (missing.length > 0) {
    throw new Error(`Missing required columns: ${missing.join(', ')}. Expected header: drug_id,batch_number,expiry_date,quantity_on_hand`)
  }

  return lines.slice(1).map((line, index) => {
    const cells = parseCsvLine(line)
    const get = (field) => cells[headers.indexOf(field)] ?? ''

    const drugId = Number(get('drug_id'))
    const quantity = Number(get('quantity_on_hand'))
    const expiryDate = get('expiry_date')
    const batchNumber = get('batch_number')

    if (!Number.isInteger(drugId) || drugId <= 0) {
      throw new Error(`Row ${index + 2}: drug_id must be a positive integer`)
    }
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new Error(`Row ${index + 2}: quantity_on_hand must be a non-negative integer`)
    }
    if (!expiryDate) {
      throw new Error(`Row ${index + 2}: expiry_date is required`)
    }
    const parsedExpiry = new Date(expiryDate)
    if (Number.isNaN(parsedExpiry.getTime())) {
      throw new Error(`Row ${index + 2}: expiry_date must be a valid date (YYYY-MM-DD)`)
    }

    return {
      drug_id: drugId,
      batch_number: batchNumber || null,
      expiry_date: expiryDate,
      quantity_on_hand: quantity,
    }
  })
}

export function getInventoryCsvTemplateRows(drugs = []) {
  if (Array.isArray(drugs) && drugs.length > 0) {
    return drugs.slice(0, 3).map((drug, index) => {
      const month = String(index + 8).padStart(2, '0')
      const day = String(index + 10).padStart(2, '0')
      return {
        drug_id: drug.id,
        batch_number: `BATCH-${drug.id}-${index + 1}`,
        expiry_date: `2027-${month}-${day}`,
        quantity_on_hand: 100 + (index * 50),
      }
    })
  }

  return [
    { drug_id: 1, batch_number: 'PA-101', expiry_date: '2027-08-12', quantity_on_hand: 500 },
    { drug_id: 2, batch_number: 'AL-202', expiry_date: '2027-11-20', quantity_on_hand: 180 },
    { drug_id: 3, batch_number: 'AM-303', expiry_date: '2028-01-09', quantity_on_hand: 220 },
  ]
}

export function buildInventoryCsvTemplate(drugs = []) {
  const header = 'drug_id,batch_number,expiry_date,quantity_on_hand'
  const rows = getInventoryCsvTemplateRows(drugs)
  const body = rows.map((row) => `${row.drug_id},${row.batch_number},${row.expiry_date},${row.quantity_on_hand}`).join('\n')
  return `${header}\n${body}\n`
}
