const oracledb = require("oracledb");

async function test() {
  let conn;

  try {
    conn = await oracledb.getConnection({
      user: "METANFT_APP",
      password: "Usama122455@",
      connectString: "(description=(retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1522)(host=adb.ap-mumbai-1.oraclecloud.com))(connect_data=(service_name=ga6aed6dfba992a_vvnzcbel5l2esbbo_low.adb.oraclecloud.com))(security=(ssl_server_dn_match=yes)))",
      walletLocation: "C:\\Users\\HC\\Desktop\\Meta NFT\\oracle-wallet"
    });
walletPassword: "Usama12345@"
    const result = await conn.execute(
      "SELECT USER AS DB_USER, SYS_CONTEXT('USERENV','SERVICE_NAME') AS SERVICE_NAME FROM DUAL"
    );

    console.log(result.rows);
    console.log("ORACLE CONNECTION OK");
  } catch (err) {
    console.error("ORACLE CONNECTION FAILED:");
    console.error(err.message);
  } finally {
    if (conn) {
      await conn.close();
    }
  }
}

test();