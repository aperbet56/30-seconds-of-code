import { Snippet } from 'build/entities/snippet';
import { SnippetContext } from 'build/adapters/snippetContext';
import { SnippetPreview } from 'build/adapters/snippetPreview';
import { ArgsError } from 'build/utilities/error';
import { JSONSerializer } from 'build/serializers/json';
import { Chunk } from 'build/utilities/chunk';
import { Logger } from 'build/utilities/logger';

/**
 * Serializes a Snippet object into appropriate JSON files.
 */
export class SnippetSerializer {
  /**
   * Serializes a Snippet object into JSON files.
   * @param {Snippet} snippet - A snippet object.
   * @throws Will throw an error if `snippet` is not of the appropriate type.
   */
  static serializeSnippet = snippet => {
    if (!(snippet instanceof Snippet)) {
      throw new ArgsError(
        "Invalid arguments. 'snippet' must be an instance of 'Snippet'."
      );
    }

    const boundLog = Logger.bind('serializers.snippet.serializeSnippet');
    const { contentPath: outDirPath } = global.settings.paths;

    let chunkPairs = [
      [
        'index',
        Chunk.createIndex(
          snippet.slug,
          'SnippetPage',
          (snippet.ranking * 0.85).toFixed(2),
          {
            vscodeUrl: snippet.vscodeUrl,
          }
        ),
      ],
      ['snippet', { snippet: new SnippetContext(snippet).toObject() }],
      [
        'metadata',
        {
          cardTemplate: snippet.config.cardTemplate,
          breadcrumbs: snippet.breadcrumbs,
          pageDescription: snippet.seoDescription,
        },
      ],
    ];

    // This check here is to make sure we don't serialize data we don't have.
    if (Object.prototype.hasOwnProperty.call(snippet, 'recommendedSnippets'))
      chunkPairs.push([
        'recommendations',
        {
          recommendedSnippets: snippet.recommendedSnippets.map(s =>
            new SnippetPreview(s).toObject()
          ),
        },
      ]);

    try {
      return JSONSerializer.serializeToDir(
        `${outDirPath}/${snippet.slug.slice(1)}`,
        ...chunkPairs
      );
    } catch (err) {
      boundLog(`Encountered an error while serializing ${snippet.id}`, 'error');
      boundLog(`${err}`, 'error');
      throw err;
    }
  };
}
