-- 更新存储过程：双向同步（包含新表）
DELIMITER //
DROP PROCEDURE IF EXISTS sp_bidirectional_sync//
CREATE PROCEDURE sp_bidirectional_sync(
    IN p_user_id INT,
    IN p_local_accounts JSON,
    IN p_local_transactions JSON,
    IN p_local_categories JSON,
    IN p_local_credit_cards JSON,
    IN p_local_credit_card_bills JSON,
    IN p_local_loans JSON,
    IN p_local_loan_payments JSON,
    IN p_local_installment_templates JSON,
    IN p_local_installments JSON,
    IN p_local_merchants JSON,
    IN p_local_projects JSON,
    IN p_local_members JSON,
    IN p_local_transaction_merchants JSON,
    IN p_local_transaction_projects JSON,
    IN p_local_transaction_members JSON,
    OUT p_result JSON
)
BEGIN
    DECLARE v_sync_time TIMESTAMP DEFAULT NOW();
    DECLARE v_error_msg TEXT DEFAULT NULL;
    DECLARE v_accounts_result INT;
    DECLARE v_transactions_result INT;
    DECLARE v_categories_result INT;
    DECLARE v_credit_cards_result INT;
    DECLARE v_credit_card_bills_result INT;
    DECLARE v_loans_result INT;
    DECLARE v_loan_payments_result INT;
    DECLARE v_installment_templates_result INT;
    DECLARE v_installments_result INT;
    DECLARE v_merchants_result INT;
    DECLARE v_projects_result INT;
    DECLARE v_members_result INT;
    DECLARE v_transaction_merchants_result INT;
    DECLARE v_transaction_projects_result INT;
    DECLARE v_transaction_members_result INT;
    DECLARE v_db_accounts JSON;
    DECLARE v_db_transactions JSON;
    DECLARE v_db_categories JSON;
    DECLARE v_db_credit_cards JSON;
    DECLARE v_db_credit_card_bills JSON;
    DECLARE v_db_loans JSON;
    DECLARE v_db_loan_payments JSON;
    DECLARE v_db_installment_templates JSON;
    DECLARE v_db_installments JSON;
    DECLARE v_db_merchants JSON;
    DECLARE v_db_projects JSON;
    DECLARE v_db_members JSON;
    DECLARE v_db_transaction_merchants JSON;
    DECLARE v_db_transaction_projects JSON;
    DECLARE v_db_transaction_members JSON;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 v_error_msg = MESSAGE_TEXT;
        ROLLBACK;
        INSERT INTO sync_logs (user_id, sync_type, table_name, record_count, status, error_message, completed_at)
        VALUES (p_user_id, 'bidirectional', 'all', 0, 'failed', v_error_msg, NOW());
        SET p_result = JSON_OBJECT('error', v_error_msg);
    END;
    
    START TRANSACTION;
    
    -- 1. 从本地同步到数据库
    CALL sp_sync_local_to_db(p_user_id, 'accounts', p_local_accounts, v_accounts_result);
    CALL sp_sync_local_to_db(p_user_id, 'transactions', p_local_transactions, v_transactions_result);
    CALL sp_sync_local_to_db(p_user_id, 'categories', p_local_categories, v_categories_result);
    CALL sp_sync_local_to_db(p_user_id, 'credit_cards', p_local_credit_cards, v_credit_cards_result);
    CALL sp_sync_local_to_db(p_user_id, 'credit_card_bills', p_local_credit_card_bills, v_credit_card_bills_result);
    CALL sp_sync_local_to_db(p_user_id, 'loans', p_local_loans, v_loans_result);
    CALL sp_sync_local_to_db(p_user_id, 'loan_payments', p_local_loan_payments, v_loan_payments_result);
    CALL sp_sync_local_to_db(p_user_id, 'installment_templates', p_local_installment_templates, v_installment_templates_result);
    CALL sp_sync_local_to_db(p_user_id, 'installments', p_local_installments, v_installments_result);
    CALL sp_sync_local_to_db(p_user_id, 'merchants', p_local_merchants, v_merchants_result);
    CALL sp_sync_local_to_db(p_user_id, 'projects', p_local_projects, v_projects_result);
    CALL sp_sync_local_to_db(p_user_id, 'members', p_local_members, v_members_result);
    CALL sp_sync_local_to_db(p_user_id, 'transaction_merchants', p_local_transaction_merchants, v_transaction_merchants_result);
    CALL sp_sync_local_to_db(p_user_id, 'transaction_projects', p_local_transaction_projects, v_transaction_projects_result);
    CALL sp_sync_local_to_db(p_user_id, 'transaction_members', p_local_transaction_members, v_transaction_members_result);
    
    -- 2. 从数据库同步到本地
    CALL sp_sync_db_to_local(p_user_id, 'accounts', NULL, v_db_accounts);
    CALL sp_sync_db_to_local(p_user_id, 'transactions', NULL, v_db_transactions);
    CALL sp_sync_db_to_local(p_user_id, 'categories', NULL, v_db_categories);
    CALL sp_sync_db_to_local(p_user_id, 'credit_cards', NULL, v_db_credit_cards);
    CALL sp_sync_db_to_local(p_user_id, 'credit_card_bills', NULL, v_db_credit_card_bills);
    CALL sp_sync_db_to_local(p_user_id, 'loans', NULL, v_db_loans);
    CALL sp_sync_db_to_local(p_user_id, 'loan_payments', NULL, v_db_loan_payments);
    CALL sp_sync_db_to_local(p_user_id, 'installment_templates', NULL, v_db_installment_templates);
    CALL sp_sync_db_to_local(p_user_id, 'installments', NULL, v_db_installments);
    CALL sp_sync_db_to_local(p_user_id, 'merchants', NULL, v_db_merchants);
    CALL sp_sync_db_to_local(p_user_id, 'projects', NULL, v_db_projects);
    CALL sp_sync_db_to_local(p_user_id, 'members', NULL, v_db_members);
    CALL sp_sync_db_to_local(p_user_id, 'transaction_merchants', NULL, v_db_transaction_merchants);
    CALL sp_sync_db_to_local(p_user_id, 'transaction_projects', NULL, v_db_transaction_projects);
    CALL sp_sync_db_to_local(p_user_id, 'transaction_members', NULL, v_db_transaction_members);
    
    COMMIT;
    
    -- 返回同步结果
    SET p_result = JSON_OBJECT(
        'sync_time', v_sync_time,
        'local_to_db', JSON_OBJECT(
            'accounts', v_accounts_result,
            'transactions', v_transactions_result,
            'categories', v_categories_result,
            'credit_cards', v_credit_cards_result,
            'credit_card_bills', v_credit_card_bills_result,
            'loans', v_loans_result,
            'loan_payments', v_loan_payments_result,
            'installment_templates', v_installment_templates_result,
            'installments', v_installments_result,
            'merchants', v_merchants_result,
            'projects', v_projects_result,
            'members', v_members_result,
            'transaction_merchants', v_transaction_merchants_result,
            'transaction_projects', v_transaction_projects_result,
            'transaction_members', v_transaction_members_result
        ),
        'db_to_local', JSON_OBJECT(
            'accounts', JSON_LENGTH(v_db_accounts),
            'transactions', JSON_LENGTH(v_db_transactions),
            'categories', JSON_LENGTH(v_db_categories),
            'credit_cards', JSON_LENGTH(v_db_credit_cards),
            'credit_card_bills', JSON_LENGTH(v_db_credit_card_bills),
            'loans', JSON_LENGTH(v_db_loans),
            'loan_payments', JSON_LENGTH(v_db_loan_payments),
            'installment_templates', JSON_LENGTH(v_db_installment_templates),
            'installments', JSON_LENGTH(v_db_installments),
            'merchants', JSON_LENGTH(v_db_merchants),
            'projects', JSON_LENGTH(v_db_projects),
            'members', JSON_LENGTH(v_db_members),
            'transaction_merchants', JSON_LENGTH(v_db_transaction_merchants),
            'transaction_projects', JSON_LENGTH(v_db_transaction_projects),
            'transaction_members', JSON_LENGTH(v_db_transaction_members)
        ),
        'data', JSON_OBJECT(
            'accounts', v_db_accounts,
            'transactions', v_db_transactions,
            'categories', v_db_categories,
            'credit_cards', v_db_credit_cards,
            'credit_card_bills', v_db_credit_card_bills,
            'loans', v_db_loans,
            'loan_payments', v_db_loan_payments,
            'installment_templates', v_db_installment_templates,
            'installments', v_db_installments,
            'merchants', v_db_merchants,
            'projects', v_db_projects,
            'members', v_db_members,
            'transaction_merchants', v_db_transaction_merchants,
            'transaction_projects', v_db_transaction_projects,
            'transaction_members', v_db_transaction_members,
            'investment_accounts', v_db_investment_accounts,
            'investment_details', v_db_investment_details,
            'dimensions', v_db_dimensions,
            'ledgers', v_db_ledgers,
            'user_defaults', v_db_user_defaults
        )
    );
END//
DELIMITER ;
