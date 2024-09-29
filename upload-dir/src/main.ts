import * as core from '@actions/core';
import type { BatchId, BeeRequestOptions, CollectionUploadOptions } from '@ethersphere/bee-js';
import { Bee } from '@ethersphere/bee-js';
import { parseHeaders } from 'swarm-actions-libs';
import { toBoolean, toNumber, toString } from './options';

type Inputs = {
  beeUrl: string;
  postageBatchId: BatchId;
  dir: string;
  headers: Record<string, string>;
  options: CollectionUploadOptions;
  requestOptions: BeeRequestOptions;
};

const run = async ({ beeUrl, postageBatchId, dir, headers, options, requestOptions }: Inputs): Promise<void> => {
  try {
    const bee = new Bee(beeUrl, { headers });
    core.info(`Starting upload from directory: ${dir} using postage batch: ${postageBatchId}`);

    const { reference, tagUid } = await bee.uploadFilesFromDirectory(postageBatchId, dir, options, requestOptions);
    core.info(`Files successfully uploaded. Reference: ${reference}, Tag UID: ${tagUid}`);

    core.setOutput('reference', reference);
    core.setOutput('tagUid', tagUid);
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    core.error(`Error during upload: ${errorMessage}`);
    core.setFailed(`Error uploading files: ${errorMessage}`);
  }
};

const main = async (): Promise<void> => {
  try {
    const beeUrl = core.getInput('bee-url', { required: true });
    const postageBatchIdInput = core.getInput('postage-batch-id', { required: true });
    const dir = core.getInput('dir', { required: true });

    // Validate postageBatchId format
    if (!/^[0-9a-fA-F]{64}$/.test(postageBatchIdInput)) {
      throw new Error('postage-batch-id must be a 64-character hexadecimal string');
    }

    // Type cast the validated postageBatchId to BatchId
    const postageBatchId = postageBatchIdInput as BatchId;

    const headers = parseHeaders(core.getInput('headers'));

    const options: CollectionUploadOptions = {
      deferred: toBoolean(core.getInput('deferred')),
      encrypt: toBoolean(core.getInput('encrypt')),
      errorDocument: toString(core.getInput('error-document')),
      indexDocument: toString(core.getInput('index-document')),
      pin: toBoolean(core.getInput('pin')),
      tag: toNumber(core.getInput('tag')),
    };

    const requestOptions: BeeRequestOptions = {
      retry: toNumber(core.getInput('retry')),
      timeout: toNumber(core.getInput('timeout')),
    };

    core.info(`Running upload with Bee URL: ${beeUrl}, directory: ${dir}`);
    
    await run({
      beeUrl,
      dir,
      postageBatchId,
      headers,
      options,
      requestOptions,
    });
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    core.error(`Error in main function: ${errorMessage}`);
    core.setFailed(`Error running main: ${errorMessage}`);
  }
};

// Catch unhandled promise rejections
main().catch((err) => {
  const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
  core.error(`Unhandled error: ${errorMessage}`);
  core.setFailed(errorMessage);
});
