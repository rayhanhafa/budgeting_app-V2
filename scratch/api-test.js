import axios from 'axios';
import fs from 'fs';

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  let results = [];
  const log = (name, pass, note = '') => {
    results.push({ name, pass, note });
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name} ${note ? '- ' + note : ''}`);
  };

  try {
    // 1.2 POST /api/auth/register
    try {
      await axios.post(`${API_URL}/auth/register`, { name: 't', email: `t-${Date.now()}@t.com`, password: 'p' });
      log('1.2 Register Disable', false, 'Expected 403, got success');
    } catch (e) {
      if (e.response && e.response.status === 403) {
        log('1.2 Register Disable', true);
      } else {
        log('1.2 Register Disable', false, `Expected 403, got ${e.response?.status}`);
      }
    }

    // 1.3 Login User 1
    let token1, token2;
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email: 'rayhanhafa@gmail.com', password: 'm34t0g9I+oQO' });
      token1 = res.data.token;
      log('1.3 Login User 1', true);
    } catch (e) {
      log('1.3 Login User 1', false, e.message);
    }
    
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email: 'kkucingtidurr00@gmail.com', password: 'j98Y1jfRnOaw' });
      token2 = res.data.token;
      log('1.3 Login User 2', true);
    } catch (e) {
      log('1.3 Login User 2', false, e.message);
    }

    // 1.5 Access without token
    try {
      await axios.get(`${API_URL}/accounts`);
      log('1.5 No token', false, 'Expected 401');
    } catch (e) {
      if (e.response && e.response.status === 401) {
        log('1.5 No token', true);
      } else {
        log('1.5 No token', false, `Expected 401, got ${e.response?.status}`);
      }
    }

    // 1.6 Access with bad token
    try {
      await axios.get(`${API_URL}/accounts`, { headers: { Authorization: `Bearer ${token1.slice(0, -5)}` } });
      log('1.6 Bad token', false, 'Expected 401/403');
    } catch (e) {
      if (e.response && (e.response.status === 401 || e.response.status === 403)) {
        log('1.6 Bad token', true);
      } else {
        log('1.6 Bad token', false, `Expected 401/403, got ${e.response?.status}`);
      }
    }

    // 2.1 Create accounts
    let accountA, accountB;
    try {
      const resA = await axios.post(`${API_URL}/accounts`, { name: 'Bank A', type: 'BANK', balance: 1000000 }, { headers: { Authorization: `Bearer ${token1}` } });
      accountA = resA.data;
      const resB = await axios.post(`${API_URL}/accounts`, { name: 'Cash B', type: 'CASH', balance: 500000 }, { headers: { Authorization: `Bearer ${token1}` } });
      accountB = resB.data;
      log('2.1 Create accounts', true);
    } catch (e) {
      log('2.1 Create accounts', false, e.response?.data?.message || e.message);
    }

    // 2.2 Edit account
    try {
      const res = await axios.put(`${API_URL}/accounts/${accountA.id}`, { name: 'Bank AA' }, { headers: { Authorization: `Bearer ${token1}` } });
      if (res.data.name === 'Bank AA') log('2.2 Edit account', true);
      else log('2.2 Edit account', false, 'Name not updated');
    } catch (e) {
      log('2.2 Edit account', false, e.message);
    }

    // 2.3 Delete account (no transactions)
    try {
      const resC = await axios.post(`${API_URL}/accounts`, { name: 'Temp', type: 'EWALLET', balance: 0 }, { headers: { Authorization: `Bearer ${token1}` } });
      await axios.delete(`${API_URL}/accounts/${resC.data.id}`, { headers: { Authorization: `Bearer ${token1}` } });
      log('2.3 Delete account (no tx)', true);
    } catch (e) {
      log('2.3 Delete account (no tx)', false, e.message);
    }

    // 4.1 Income transaction
    let incomeTx;
    try {
      const res = await axios.post(`${API_URL}/transactions`, {
        accountId: accountA.id,
        categoryId: null, // might need a category, let's see
        amount: 200000,
        type: 'INCOME',
        date: new Date().toISOString(),
        description: 'Salary'
      }, { headers: { Authorization: `Bearer ${token1}` } });
      incomeTx = res.data;
      
      const accRes = await axios.get(`${API_URL}/accounts`, { headers: { Authorization: `Bearer ${token1}` } });
      const acc = accRes.data.find(a => a.id === accountA.id);
      if (Number(acc.balance) === 1200000) {
        log('4.1 Income tx updates balance', true);
      } else {
        log('4.1 Income tx updates balance', false, `Balance is ${acc.balance}, expected 1200000`);
      }
    } catch (e) {
      log('4.1 Income tx', false, e.response?.data?.message || e.message);
    }

    // 4.6 Send negative amount
    try {
      await axios.post(`${API_URL}/transactions`, {
        accountId: accountA.id,
        amount: -50000,
        type: 'INCOME',
        date: new Date().toISOString(),
      }, { headers: { Authorization: `Bearer ${token1}` } });
      log('4.6 Negative amount', false, 'Expected rejection');
    } catch (e) {
      if (e.response && e.response.status === 400) log('4.6 Negative amount', true);
      else log('4.6 Negative amount', false, `Got ${e.response?.status}`);
    }

    // 4.7 Send string amount
    try {
      await axios.post(`${API_URL}/transactions`, {
        accountId: accountA.id,
        amount: 'abc',
        type: 'INCOME',
        date: new Date().toISOString(),
      }, { headers: { Authorization: `Bearer ${token1}` } });
      log('4.7 String amount', false, 'Expected rejection');
    } catch (e) {
      if (e.response && e.response.status === 400) log('4.7 String amount', true);
      else log('4.7 String amount', false, `Got ${e.response?.status}`);
    }
    
    // 1.7 IDOR Check
    try {
      await axios.get(`${API_URL}/transactions/${incomeTx.id}`, { headers: { Authorization: `Bearer ${token2}` } });
      log('1.7 IDOR transaction', false, 'Expected 404/403');
    } catch (e) {
      if (e.response && (e.response.status === 404 || e.response.status === 403)) {
         log('1.7 IDOR transaction', true);
      } else {
         log('1.7 IDOR transaction', false, `Got ${e.response?.status}`);
      }
    }

    // 2.4 Delete account with transaction
    try {
      await axios.delete(`${API_URL}/accounts/${accountA.id}`, { headers: { Authorization: `Bearer ${token1}` } });
      log('2.4 Delete acc w/ tx', false, 'Expected error restrict');
    } catch (e) {
      if (e.response && e.response.status === 400) log('2.4 Delete acc w/ tx', true, e.response.data.message);
      else log('2.4 Delete acc w/ tx', false, `Got ${e.response?.status}`);
    }

    // 4.3 Edit Income tx (lower amount)
    try {
      const res = await axios.put(`${API_URL}/transactions/${incomeTx.id}`, {
        accountId: accountA.id,
        amount: 100000,
        type: 'INCOME',
        date: new Date().toISOString(),
      }, { headers: { Authorization: `Bearer ${token1}` } });
      const accRes = await axios.get(`${API_URL}/accounts`, { headers: { Authorization: `Bearer ${token1}` } });
      const acc = accRes.data.find(a => a.id === accountA.id);
      if (Number(acc.balance) === 1100000) log('4.4 Edit tx (lower amount) updates balance', true);
      else log('4.4 Edit tx updates balance', false, `Balance ${acc.balance} expected 1100000`);
    } catch (e) {
      log('4.4 Edit tx updates balance', false, e.message);
    }

    // 5.1 Transfer transaction
    let transferTx;
    try {
      const res = await axios.post(`${API_URL}/transactions`, {
        accountId: accountA.id,
        toAccountId: accountB.id,
        amount: 50000,
        type: 'TRANSFER',
        date: new Date().toISOString(),
      }, { headers: { Authorization: `Bearer ${token1}` } });
      transferTx = res.data;
      
      const accRes = await axios.get(`${API_URL}/accounts`, { headers: { Authorization: `Bearer ${token1}` } });
      const accA = accRes.data.find(a => a.id === accountA.id);
      const accB = accRes.data.find(a => a.id === accountB.id);
      
      if (Number(accA.balance) === 1050000 && Number(accB.balance) === 550000) {
        log('5.1 Transfer tx updates balances', true);
      } else {
        log('5.1 Transfer tx updates balances', false, `A: ${accA.balance}, B: ${accB.balance}`);
      }
    } catch (e) {
      log('5.1 Transfer tx updates balances', false, e.message);
    }

    // 5.2 Edit Transfer transaction
    try {
      await axios.put(`${API_URL}/transactions/${transferTx.id}`, {
        accountId: accountA.id,
        toAccountId: accountB.id,
        amount: 100000,
        type: 'TRANSFER',
        date: new Date().toISOString(),
      }, { headers: { Authorization: `Bearer ${token1}` } });
      
      const accRes = await axios.get(`${API_URL}/accounts`, { headers: { Authorization: `Bearer ${token1}` } });
      const accA = accRes.data.find(a => a.id === accountA.id);
      const accB = accRes.data.find(a => a.id === accountB.id);
      
      if (Number(accA.balance) === 1000000 && Number(accB.balance) === 600000) {
        log('5.2 Edit Transfer updates balances', true);
      } else {
        log('5.2 Edit Transfer updates balances', false, `A: ${accA.balance}, B: ${accB.balance}`);
      }
    } catch (e) {
      log('5.2 Edit Transfer updates balances', false, e.message);
    }

    // 5.3 Delete Transfer
    try {
      await axios.delete(`${API_URL}/transactions/${transferTx.id}`, { headers: { Authorization: `Bearer ${token1}` } });
      const accRes = await axios.get(`${API_URL}/accounts`, { headers: { Authorization: `Bearer ${token1}` } });
      const accA = accRes.data.find(a => a.id === accountA.id);
      const accB = accRes.data.find(a => a.id === accountB.id);
      
      if (Number(accA.balance) === 1100000 && Number(accB.balance) === 500000) {
        log('5.3 Delete Transfer restores balances', true);
      } else {
        log('5.3 Delete Transfer restores balances', false, `A: ${accA.balance}, B: ${accB.balance}`);
      }
    } catch (e) {
      log('5.3 Delete Transfer restores balances', false, e.message);
    }

    // 6.2 Budget Upsert
    try {
      const catsRes = await axios.get(`${API_URL}/categories`, { headers: { Authorization: `Bearer ${token1}` } });
      const cat = catsRes.data[0];
      if (cat) {
        await axios.post(`${API_URL}/budgets`, {
          categoryId: cat.id,
          amount: 5000,
          month: 1,
          year: 2026
        }, { headers: { Authorization: `Bearer ${token1}` } });
        
        await axios.post(`${API_URL}/budgets`, {
          categoryId: cat.id,
          amount: 10000,
          month: 1,
          year: 2026
        }, { headers: { Authorization: `Bearer ${token1}` } });
        
        const budRes = await axios.get(`${API_URL}/budgets/progress?month=1&year=2026`, { headers: { Authorization: `Bearer ${token1}` } });
        const budget = budRes.data.find(b => b.category.id === cat.id);
        if (Number(budget?.budgetAmount) === 10000) log('6.2 Budget Upsert', true);
        else log('6.2 Budget Upsert', false, 'Did not update');
      }
    } catch (e) {
      log('6.2 Budget Upsert', false, e.message);
    }
    // 1.4 Rate limit (Login with wrong password 11 times)
    try {
      for (let i = 0; i < 11; i++) {
        await axios.post(`${API_URL}/auth/login`, { email: 'rayhanhafa@gmail.com', password: 'wrong' }).catch(() => {});
      }
      // 12th attempt should hit rate limit (max 10)
      await axios.post(`${API_URL}/auth/login`, { email: 'rayhanhafa@gmail.com', password: 'wrong' });
      log('1.4 Rate limit', false, 'Rate limit did not trigger');
    } catch (e) {
      if (e.response && e.response.status === 429) {
        log('1.4 Rate limit', true, 'Blocked at 429');
      } else {
        log('1.4 Rate limit', false, `Got ${e.response?.status} instead of 429`);
      }
    }
  } catch (e) {
    console.error(e);
  }

  console.log('\n--- RESULTS ---');
  console.table(results);
}

runTests();
