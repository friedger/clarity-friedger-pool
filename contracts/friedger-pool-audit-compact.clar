;; bitcoin reward address of the pool
(define-constant pool-reward-addr-hash 0xc70e1ca5a5ef633fe5464821ca421c173997f388)
;;(define-constant pool-pubscriptkey (concat (concat 0xa914 pool-reward-addr-hash) 0x87))
(define-constant pool-pubscriptkey (concat (concat 0x76a914 pool-reward-addr-hash) 0x88ac))

(define-private (find-pool-out-compact (entry {scriptPubKey: (buff 128), value: uint}) (result (optional {scriptPubKey: (buff 128), value: uint})))
   (if (is-eq (get scriptPubKey entry) pool-pubscriptkey)
    (some entry)
    none))

(define-read-only (get-tx-value-for-pool-compact (tx (buff 1024)))
  (let ((transaction (unwrap! (contract-call? .clarity-bitcoin parse-tx tx) ERR_FAILED_TO_PARSE_TX)))
    (ok (fold find-pool-out-compact (get outs transaction) none))))

(define-constant ERR_FAILED_TO_PARSE_TX (err u1))
