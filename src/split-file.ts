import fs from 'node:fs'
import path from 'node:path'

type PartInfo = {
  number: number
  start: number
  end: number
}

/** Split the file, given by partinfos and filepath */
const __splitFile = async (file: string, partInfo: PartInfo[], dest: string | undefined) => {
  // Now the magic. Read buffers with length..
  const partFiles = [] as string[]

  await Promise.all(partInfo.map((info) => {
    return new Promise((resolve, reject) => {
      // Open up a reader
      const reader = fs.createReadStream(file, {
        start: info.start,
        end: info.end - 1
      })

      // Part name (file name of part)
      // get the max number of digits to generate for part number
      // ex. if original file is split into 4 files, then it will be 1
      // ex. if original file is split into 14 files, then it will be 2
      // etc.
      const maxPaddingCount = String(partInfo.length).length
      // initial part number
      // ex. '0', '00', '000', etc.
      let currentPad = ''
      for (let i = 0; i < maxPaddingCount; i++) {
        currentPad += '0'
      }
      // construct part number for current file part
      // <file>.sf-part01
      // ...
      // <file>.sf-part14
      const unpaddedPartNumber = '' + info.number
      const partNumber = currentPad.substring(0, currentPad.length - unpaddedPartNumber.length) + unpaddedPartNumber
      const partName = file + '.sf-part' + partNumber

      const outputFile = (filename: string) => {
        const writer = fs.createWriteStream(filename)
        const pipe = reader.pipe(writer)
        pipe.on('error', reject)
        pipe.on('finish', resolve)
      }

      if (dest) {
        const filename = path.basename(partName)
        if (dest.charAt(dest.length - 1) !== '/') {
          dest += '/'
        }
        outputFile(dest + filename)
        partFiles.push(dest + filename)
      } else {
        outputFile(partName)
        partFiles.push(partName)
      }
      // Pipe reader to writer
    })
  }))

  return partFiles
}

/** Split file into number of parts */
export const splitFile = async (file: string, parts: number, dest?: string) => {
  // Validate parameters
  if (parts < 1) {
    throw new Error('Parameter "parts" is invalid, must contain an integer value')
  }

  const stat = fs.statSync(file)
  if (stat.isFile() === false) {
    throw new Error('Given file is not valid')
  }
  if (!stat.size) {
    throw new Error('File is empty')
  }

  const totalSize = stat.size
  const splitSize = Math.floor(totalSize / parts)

  // If size of the parts is 0 then you have more parts than bytes.
  if (splitSize < 1) {
    throw new Error('Too many parts, or file too small!')
  }

  // Get last split size, this is different from the others because it uses scrap value.
  const lastSplitSize = splitSize + (totalSize % parts)

  // Capture the partinfo in here:
  const partInfo = [] as PartInfo[]

  // Iterate the parts
  for (let i = 0; i < parts; i++) {
    partInfo[i] = {
      number: i + 1,

      // Set buffer read start position
      start: i * splitSize,

      // Set total ending position
      end: i * splitSize + splitSize
    }

    if (i === parts - 1) {
      partInfo[i].end = i * splitSize + lastSplitSize
    }
  }

  return __splitFile(file, partInfo, dest)
}

/** Split file into multiple parts based on max part size given */
export const splitFileBySize = async (file: string, maxSize: number, dest?: string) => {
  const stat = fs.statSync(file)

  if (stat.isFile() === false) {
    throw new Error('Given file is not valid')
  }
  if (!stat.size) {
    throw new Error('File is empty')
  }

  const totalSize = stat.size

  // Number of parts (exclusive last part!)
  const parts = Math.ceil(totalSize / maxSize)
  const splitSize = Math.round(maxSize)

  // If size of the parts is 0 then you have more parts than bytes.
  if (splitSize < 1) {
    throw new Error('Too many parts or file too small!')
  }

  // Capture the partinfo in here:
  const partInfo = [] as PartInfo[]

  // Iterate the parts
  for (let i = 0; i < parts; i++) {
    partInfo[i] = {
      number: i + 1,

      // Set buffer read start position
      start: i * splitSize,

      // Set total ending position
      end: i * splitSize + splitSize
    }
  }

  // recalculate the size of the last chunk
  partInfo[partInfo.length - 1].end = totalSize

  return __splitFile(file, partInfo, dest)
}

/** Merge input files to output file */
export const mergeFiles = async (inputFiles: string[], outputFile: string) => {
  // Validate parameters.
  if (inputFiles.length <= 0) {
    throw new Error('Make sure you input an array with files as first parameter!')
  }

  const writer = fs.createWriteStream(outputFile)

  await Promise.all(inputFiles.map((file) => {
    return new Promise((resolve, reject) => {
      const reader = fs.createReadStream(file)
      reader.pipe(writer, { end: false })
      reader.on('error', reject)
      reader.on('end', resolve)
    })
  }))

  writer.close()
  return outputFile
}
