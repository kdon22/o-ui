// Mock Monaco Editor for Jest testing

const mockEditor = {
  createModel: jest.fn().mockReturnValue({
    dispose: jest.fn(),
    getLineContent: jest.fn((lineNumber) => {
      // Return sample content based on line number
      const sampleLines = [
        '',
        'airsegmentList = [AirSegment(), AirSegment()]',
        '',
        'for airsegment in airsegmentList',
        '   if airsegment.carrier = "AC"',
        '      processSegment = true',
        '',
        '   if airsegment.flightNumber > 1000',
        '      isLongHaul = true'
      ]
      return sampleLines[lineNumber - 1] || ''
    }),
    getVersionId: jest.fn().mockReturnValue(1),
    getLineCount: jest.fn().mockReturnValue(10),
    getValue: jest.fn().mockReturnValue(`airsegmentList = [AirSegment(), AirSegment()]

for airsegment in airsegmentList
   if airsegment.carrier = "AC"
      processSegment = true
   
   if airsegment.flightNumber > 1000
      isLongHaul = true`)
  }),
  
  IStandaloneCodeEditor: jest.fn(),
  
  defineTheme: jest.fn(),
  setTheme: jest.fn(),
  
  CompletionItemKind: {
    Text: 1,
    Method: 2,
    Function: 3,
    Constructor: 4,
    Field: 5,
    Variable: 6,
    Class: 7,
    Interface: 8,
    Module: 9,
    Property: 10,
    Unit: 11,
    Value: 12,
    Enum: 13,
    Keyword: 14,
    Snippet: 15,
    Color: 16,
    File: 17,
    Reference: 18,
    Folder: 19,
    EnumMember: 20,
    Constant: 21,
    Struct: 22,
    Event: 23,
    Operator: 24,
    TypeParameter: 25
  }
}

const Position = jest.fn().mockImplementation((lineNumber, column) => ({
  lineNumber,
  column,
  equals: jest.fn().mockReturnValue(false),
  isBefore: jest.fn().mockReturnValue(false),
  isBeforeOrEqual: jest.fn().mockReturnValue(false),
  clone: jest.fn().mockReturnValue({ lineNumber, column }),
  toString: jest.fn().mockReturnValue(`Position(${lineNumber},${column})`)
}))

const Range = jest.fn().mockImplementation((startLineNumber, startColumn, endLineNumber, endColumn) => ({
  startLineNumber,
  startColumn, 
  endLineNumber,
  endColumn,
  isEmpty: jest.fn().mockReturnValue(false),
  containsPosition: jest.fn().mockReturnValue(false),
  containsRange: jest.fn().mockReturnValue(false)
}))

module.exports = {
  editor: mockEditor,
  Position,
  Range,
  languages: {
    registerCompletionItemProvider: jest.fn(),
    registerHoverProvider: jest.fn(),
    setLanguageConfiguration: jest.fn(),
    setMonarchTokensProvider: jest.fn(),
    CompletionItemKind: mockEditor.CompletionItemKind
  },
  KeyCode: {
    Enter: 3,
    Escape: 9,
    Space: 10,
    Tab: 2
  },
  KeyMod: {
    CtrlCmd: 2048,
    Shift: 1024,
    Alt: 512,
    WinCtrl: 256
  }
}