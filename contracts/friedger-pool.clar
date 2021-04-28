;; bitcoin reward address of the pool
(define-constant POOL_REWARD_ADDR 0x002443)

;; store reward txs and their value (from up to 100 miners per block)
(define-map reward-txs
  uint (list 100 {tx: (buff 1024), value: uint}))


(define-private (find-pool-out (entry {scriptPubKey: (buff 128), value: uint}) (result (optional {scriptPubKey: (buff 128), value: uint})))
  (if (is-eq (get scriptPubKey entry) POOL_REWARD_ADDR)
    (some entry)
    result))

(define-private (get-tx-value-for-pool (tx (buff 1024)))
  (let ((transaction (unwrap! (contract-call? .clarity-bitcoin parse-tx tx) ERR_FAILED_TO_PARSE_TX)))
    (ok (fold find-pool-out (get outs transaction) none))))

(define-private (map-add-tx (height uint) (tx (buff 1024)) (pool-out-value uint))
  (let ((entry {tx: tx, value: pool-out-value}))
    (match (map-get? reward-txs height)
      txs (ok (map-set reward-txs height (unwrap! (as-max-len? (append txs entry) u100) ERR_TOO_MANY_TXS)))
      (ok (map-insert reward-txs height (list entry))))))

(define-public (submit-reward-tx (block { header: (buff 80), height: uint }) (tx (buff 1024)) (proof { tx-index: uint, hashes: (list 12 (buff 32)), tree-depth: uint }))
  (match (contract-call? .clarity-bitcoin was-tx-mined?  block tx proof)
    result
      (begin
        (asserts! result ERR_VERIFICATION_FAILED)
        (let ((pool-out (unwrap! (unwrap! (get-tx-value-for-pool tx) ERR_FAILED_TO_PARSE_TX) ERR_TX_NOT_FOR_POOL)))
            (match (map-add-tx (get height block) tx (get value pool-out))
              result-map-add (begin
                (asserts! result-map-add ERR_TX_ADD_FAILED)
                (ok true))
              error-map-add (err error-map-add))))
    error (err error)))

;; Error handling
(define-constant ERR_FAILED_TO_PARSE_TX (err u1))
(define-constant ERR_VERIFICATION_FAILED (err u2))
(define-constant ERR_INSERT_FAILED (err u3))
(define-constant ERR_TX_NOT_FOR_POOL (err u4))
(define-constant ERR_TOO_MANY_TXS (err u5))
(define-constant ERR_TX_ADD_FAILED (err u6))
