
import crypto, { type BinaryToTextEncoding } from 'node:crypto'
import fs from 'node:fs'
import assert from 'node:assert'
import { after, describe, test } from 'node:test'

import { mergeFiles, splitFile, splitFileBySize } from '../src/split-file'

const testRoot = import.meta.dirname
const testSubFolders = ['test1', 'test2', 'output']

const cleanUp = () => {
  for (const subFolder of testSubFolders) {
    const folder = fs.readdirSync(`${testRoot}/files/${subFolder}/`)
    for (const fileName of folder) {
      if (fileName.indexOf('sf-part') !== -1 || fileName.indexOf('.out') !== -1) {
        fs.unlinkSync(`${testRoot}/files/${subFolder}/${fileName}`)
      }
    }
  }
}
const checksum = (str: Buffer, algorithm: string, encoding: BinaryToTextEncoding) => {
  return crypto.createHash(algorithm).update(str).digest(encoding)
}
const checksumFile = (file: string, algorithm?: string, encoding?: BinaryToTextEncoding) => {
  const data = fs.readFileSync(file)
  return checksum(data, algorithm || 'md5', encoding || 'hex')
}

const md5Zip = '561a3c354bbca14cf501d5e252383387'
const md5Pdf = '6bb492c383240fcd87b5c42958c2e482'


describe('split and merge on size', () => {
  test('should create the parts based on bytes of split parts', async () => {
    const input = `${import.meta.dirname}/files/test1/sample.zip`
    const inputStat = fs.statSync(input)
    const splitSize = 100000

    await splitFileBySize(input, splitSize).then((parts) => {
      let totalPartsSize = 0
      for (const part of parts) {
        const stat = fs.statSync(part)
        assert.equal(stat.size <= splitSize, true)
        totalPartsSize += stat.size
      }
      assert.equal(totalPartsSize, inputStat.size)
    }).catch((err) => {
      console.error(err)
      assert.equal(err, null)
    })
  })

  test('should merge the splitted files', async () => {
    const files = [] as string[]

    const base = `${import.meta.dirname}/files/test1/sample.zip.sf-part`
    const output = `${import.meta.dirname}/files/test1/sample.out`
    const input = `${import.meta.dirname}/files/test1/sample.zip`

    const dir = fs.readdirSync(`${testRoot}/files/test1/`)
    for (const file of dir) {
      if (file.indexOf('sf-part') !== -1) {
        files.push(`${testRoot}/files/test1/${file}`)
      }
    }

    await mergeFiles(files, output)
      .then(() => {
        const originalStat = fs.statSync(input)
        const mergedStat = fs.statSync(output)

        assert.equal(mergedStat.size, originalStat.size)
        assert.equal(md5Zip, checksumFile(output))
      }).catch((err) => {
        console.error(err)
        assert.equal(err, null)
      })
  })

  after(() => {
    cleanUp()
  })
})


describe('split and merge on number of parts', () => {
  test('should create the parts based on number of given parts', async () => {
    const input = `${import.meta.dirname}/files/test2/sample.pdf`
    const inputStat = fs.statSync(input)
    const numberOfParts = 512

    await splitFile(input, numberOfParts).then((parts) => {
      let totalPartsSize = 0
      for (const part of parts) {
        const stat = fs.statSync(part)
        totalPartsSize += stat.size
      }
      assert.equal(totalPartsSize, inputStat.size)
    }).catch((err) => {
      console.error(err)
      assert.equal(err, null)
    })
  })

  test('should merge the splitted files', async () => {
    const files = [] as string[]

    const base = `${import.meta.dirname}/files/test2/sample.pdf.sf-part`
    const output = `${import.meta.dirname}/files/test2/sample.out`
    const input = `${import.meta.dirname}/files/test2/sample.pdf`

    const dir = fs.readdirSync(`${testRoot}/files/test2/`)
    for (const file of dir) {
      if (file.indexOf('sf-part') !== -1) {
        files.push(`${testRoot}/files/test2/${file}`)
      }
    }

    await mergeFiles(files, output)
      .then(() => {
        const originalStat = fs.statSync(input)
        const mergedStat = fs.statSync(output)

        assert.equal(mergedStat.size, originalStat.size)
        assert.equal(md5Pdf, checksumFile(output))
      }).catch((err) => {
        console.error(err)
        assert.equal(err, null)
      })
  })

  after(() => {
    cleanUp()
  })
})


describe('split files to destination folder', () => {
  test('should output files to specific folder', async () => {
    const input = `${import.meta.dirname}/files/test2/sample.pdf`
    const outputFolder = `${import.meta.dirname}/files/output`
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder)
    }
    const inputStat = fs.statSync(input)
    const numberOfParts = 512

    await splitFile(input, numberOfParts, outputFolder).then((parts) => {
      let totalPartsSize = 0
      for (const part of parts) {
        const stat = fs.statSync(part)
        totalPartsSize += stat.size
      }
      assert.equal(totalPartsSize, inputStat.size)

      const dirFiles = fs.readdirSync(outputFolder)
      assert.equal(dirFiles.length, numberOfParts)
    }).catch((err) => {
      console.error(err)
      assert.equal(err, null)
    })
  })

  after(() => {
    cleanUp()
  })
})
