(define-map stackers principal bool)
(define-public (delegate-stack-stx
  (stacker principal) (amount-ustx uint)
  (pox-addr (tuple (hashbytes (buff 20)) (version (buff 1))))
  (start-burn-ht uint)
  (lock-period uint))
  (if (is-none (print (map-get? stackers stacker)))
    (begin
      (map-set stackers stacker true)
      (ok {lock-amount: amount-ustx, stacker: stacker, unlock-burn-height: (+ start-burn-ht u100)}))

    (err 1))
)

(define-public (delegate-stx (amount-ustx uint) (delegate-to principal) (until-burn-ht (optional uint))
              (pox-addr (optional (tuple (hashbytes (buff 20)) (version (buff 1))))))
  (if true
    (ok true)
    (err 1)
  )
)

(define-public (stack-aggregation-commit (pox-address (tuple (hashbytes (buff 20)) (version (buff 1)))) (reward-cycle uint))
 (if true
    (ok true)
    (err 1)
  )
)

(define-public (revoke-delegate-stx)
  (ok true)
)

(define-public (allow-contract-caller (contract principal) (until-burn-ht (optional uint)))
  (ok true))