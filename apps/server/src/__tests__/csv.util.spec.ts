import { escapeCsvField, generateCsv } from '../common/utils/csv.util'

describe('CSV Utility', () => {
  describe('escapeCsvField', () => {
    it('should return empty string for null', () => {
      expect(escapeCsvField(null)).toBe('')
    })

    it('should return empty string for undefined', () => {
      expect(escapeCsvField(undefined)).toBe('')
    })

    it('should return string as-is when no special chars', () => {
      expect(escapeCsvField('hello')).toBe('hello')
    })

    it('should wrap field in quotes when it contains comma', () => {
      expect(escapeCsvField('hello,world')).toBe('"hello,world"')
    })

    it('should wrap field in quotes when it contains double quote', () => {
      expect(escapeCsvField('say "hello"')).toBe('"say ""hello"""')
    })

    it('should wrap field in quotes when it contains newline', () => {
      expect(escapeCsvField('line1\nline2')).toBe('"line1\nline2"')
    })

    it('should convert numbers to strings', () => {
      expect(escapeCsvField(42)).toBe('42')
    })

    it('should convert booleans to strings', () => {
      expect(escapeCsvField(true)).toBe('true')
    })
  })

  describe('generateCsv', () => {
    it('should generate CSV with headers and rows', () => {
      const headers = ['姓名', '年龄']
      const rows = [
        ['张三', 25],
        ['李四', 30],
      ]

      const csv = generateCsv(headers, rows)

      expect(csv).toContain('\uFEFF')
      expect(csv).toContain('姓名,年龄')
      expect(csv).toContain('张三,25')
      expect(csv).toContain('李四,30')
    })

    it('should handle empty rows', () => {
      const csv = generateCsv(['A', 'B'], [])

      const lines = csv.replace('\uFEFF', '').split('\r\n')
      expect(lines).toHaveLength(1)
      expect(lines[0]).toBe('A,B')
    })

    it('should escape fields with commas in rows', () => {
      const csv = generateCsv(['Name'], [['Smith, John']])

      expect(csv).toContain('"Smith, John"')
    })

    it('should handle null values in rows', () => {
      const csv = generateCsv(['A', 'B'], [[null, 'test']])

      expect(csv).toContain(',test')
    })

    it('should include BOM for UTF-8 encoding', () => {
      const csv = generateCsv(['Header'], [['data']])

      expect(csv.charCodeAt(0)).toBe(0xfeff)
    })
  })
})
