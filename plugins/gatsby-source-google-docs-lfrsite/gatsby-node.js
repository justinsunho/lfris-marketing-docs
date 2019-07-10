var _extends =
  Object.assign ||
  function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i]
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key]
        }
      }
    }
    return target
  }

function _objectWithoutProperties(obj, keys) {
  var target = {}
  for (var i in obj) {
    if (keys.indexOf(i) >= 0) continue
    if (!Object.prototype.hasOwnProperty.call(obj, i)) continue
    target[i] = obj[i]
  }
  return target
}

const {getAuth} = require("./utils/auth")
const {fetchGoogleDriveFiles} = require("./utils/google-drive")
const {fetchGoogleDocsDocuments} = require("./utils/google-docs")
const {createRemoteFileNode} = require("gatsby-source-filesystem")

const DEFAULT_CONFIG = {
  access_type: "offline",
  redirect_uris: ["urn:ietf:wg:oauth:2.0:oob", "http://localhost"],
  scope: [
    "https://www.googleapis.com/auth/documents.readonly",
    "https://www.googleapis.com/auth/drive.metadata.readonly",
  ],
  token_path: "google-docs-token.json",
  token_env_variable: "GDOCS_TOKEN",
}

async function getGoogleImages(document) {
  const imageNodeArr = []
  for (const element of document.content) {
    const imgTag = element.img
    if (imgTag) {
      imageNodeArr.push(imgTag)
    }
  }
  return imageNodeArr
}

exports.sourceNodes = async (
  {actions: {createNode}, createNodeId, createContentDigest, store, cache},
  _ref,
  done
) => {
  let {config} = _ref,
    options = _objectWithoutProperties(_ref, ["config"])

  if (!config.api_key) {
    throw new Error("source-google-docs: Missing API key")
  }

  if (!config.client_id) {
    throw new Error("source-google-docs: Missing client_id")
  }

  if (!config.client_secret) {
    throw new Error("source-google-docs: Missing client_secret")
  }

  if (!options.foldersIds) {
    throw new Error("source-google-docs: Missing foldersIds")
  }

  try {
    const auth = await getAuth(_extends({}, DEFAULT_CONFIG, config))

    const googleDriveFiles = await fetchGoogleDriveFiles({
      auth,
      rootFolderIds: options.foldersIds,
      fields: options.fields,
      fieldsMapper: options.fieldsMapper,
      fieldsDefault: options.fieldsDefault,
    })

    const googleDocsDocuments = await fetchGoogleDocsDocuments({
      auth,
      apiKey: config.api_key,
      googleDriveFiles,
    })
    const convertImgToNode = options.convertImgToNode
    let image = []
    for (document of googleDocsDocuments) {
      const id = createNodeId(`GoogleDocs-${document.id}`)
      let markdownNode = {
        document,
        id,
        internal: {
          type: "GoogleDocs",
          mediaType: "text/markdown",
        },
      }
      if (convertImgToNode) {
        images = await getGoogleImages(document, convertImgToNode, id)
        for (imgObj of images) {
          const imageToken = Math.random()
            .toString(36)
            .substr(2, 9)
          try {
            const url = imgObj.source
            const imageNode = await createRemoteFileNode({
              url,
              parentNodeId: id,
              store,
              cache,
              createNode,
              createNodeId,
              name: `google-doc-image-${imageToken}`,
            })

            if (imageNode) {
              document.markdown = document.markdown.replace(url, imageNode.id)
            } else {
              return
            }
          } catch (e) {
            console.log(e)
          }
        }
      }
      markdownNode.internal.content = document.markdown
      markdownNode.internal.contentDigest = createContentDigest(markdownNode)
      createNode(markdownNode)
    }
    done()
  } catch (e) {
    done(new Error(`source-google-docs: ${e.message}`))
  }
}
