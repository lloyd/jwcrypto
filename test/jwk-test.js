/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla BrowserID.
 *
 * The Initial Developer of the Original Code is Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *     Ben Adida <benadida@mozilla.com>
 *     Mike Hanson <mhanson@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var vows = require("vows"),
    assert = require("assert"),
    jwk = require("../jwk");

// signing
var ALGS = ["DS","RS"];
var KEYSIZES = [128, 256];

function batchForOneAlg(alg, keysize) {
  return {
    "generate keypair" : {
      topic: function() {
        return jwk.KeyPair.generate(alg, keysize);
      },
      "is a keypair": function(keypair) {
        assert.instanceOf(keypair, jwk.KeyPair);
      },
      "should have right algorithm": function(keypair) {
        assert.equal(keypair.algorithm, alg);
      },
      "should have right number of bits": function(keypair) {
        assert.equal(keypair.keysize, keysize);
      },
      "should have secret key": function(keypair) {
        assert.notEqual(keypair.secretKey, null);
      },
      "serialize and deserialize the public key": {
        topic: function(keypair) {
          var pk_serialized = keypair.publicKey.serialize();
          var pk = jwk.PublicKey.deserialize(pk_serialized);
          return pk;
        },
        "reconstituted pk is not null": function(pk) {
          assert.notEqual(pk, null);
        },
        "reconstituted pk has proper algorithm": function(pk) {
          assert.equal(pk.algorithm, alg);
        }
      },
      "serialize and deserialize the secret key": {
        topic: function(keypair) {
          var sk_serialized = keypair.secretKey.serialize();
          var sk = jwk.SecretKey.deserialize(sk_serialized);
          return sk;
        },
        "reconstituted sk is not null": function(sk) {
          assert.notEqual(sk, null);
        },
        "reconstituted sk has proper algorithm": function(sk) {
          assert.equal(sk.algorithm, alg);
        }
      },
      "with a message": {
        topic: function(keypair) {
          var message_to_sign= "testing!";
          return message_to_sign;
        },
        "to sign": {
          topic: function(message, keypair) {
            return keypair.secretKey.sign(message);
          },
          "signature looks okay": function(signature) {
            assert.notEqual(signature, null);
          },
          "signature": {
            topic: function(signature, message, keypair) {
              return keypair.publicKey.verify(message, signature);
            },
            "validates": function(result) {
              assert.isTrue(result);
            }
          }
        },
        "to sign with serialization": {
          topic: function(message, keypair) {
            var serialized_sk = keypair.secretKey.serialize();
            var reserialized_sk = jwk.SecretKey.deserialize(serialized_sk);
            return reserialized_sk.sign(message);
          },
          "signature looks okay": function(signature) {
            assert.notEqual(signature, null);
          },
          "signature": {
            topic: function(signature, message, keypair) {
              var serialized_pk = keypair.publicKey.serialize();
              var reserialized_pk = jwk.PublicKey.deserialize(serialized_pk);
              return reserialized_pk.verify(message, signature);
            },
            "validates": function(result) {
              assert.isTrue(result);
            }
          }
        }
        
      }
    },
    "generate async keypair" : {
      topic: function() {
        jwk.KeyPair.generate(alg, keysize, function() {}, this.callback);
      },
      "is a keypair": function(keypair, err) {
        assert.instanceOf(keypair, jwk.KeyPair);
      },
      "should have right algorithm": function(keypair, err) {
        assert.equal(keypair.algorithm, alg);
      },
      "should have right number of bits": function(keypair, err) {
        assert.equal(keypair.keysize, keysize);
      }
    }
  };
}

var suite = vows.describe('keys');

ALGS.forEach(function(alg) {
  KEYSIZES.forEach(function(keysize) {
    suite.addBatch(batchForOneAlg(alg,keysize));
  });
});

suite.export(module);